import { pool } from '../../config/database';
import { logger } from '../../utils/logger';
import crypto from 'crypto';
import * as pixUtils from 'pix-utils';
import QRCode from 'qrcode';

interface PendingCommission {
  user_id: string;
  user_name: string;
  user_email: string;
  pix_type: string | null;
  pix_key: string | null;
  pix_verified: boolean;
  total_personal: number;
  total_network: number;
  total_amount: number;
  commissions_count: number;
  oldest_commission: Date;
  latest_commission: Date;
  qr_code_payload?: string;
}

interface CommissionDetail {
  id: string;
  type: 'personal' | 'network';
  sale_id: string;
  sale_value: number;
  commission_percentage: number;
  commission_amount: number;
  sale_date: Date;
  client_name: string;
}

export class CommissionPaymentService {
  // Listar usuários com comissões pendentes
  async getPendingCommissions(): Promise<PendingCommission[]> {
    try {
      logger.info('🔍 [PIX-DEBUG] Iniciando busca de comissões pendentes de vendas aprovadas...');
      
      const result = await pool.query(`
        SELECT 
          u.id as user_id,
          u.name as user_name,
          u.email as user_email,
          u.pix_type,
          u.pix_key,
          CASE WHEN u.pix_key IS NOT NULL AND u.pix_key != '' THEN true ELSE false END as pix_verified,
          COALESCE(SUM(CASE WHEN pc.id IS NOT NULL AND pc.paid = false AND s1.status = 'approved' THEN pc.commission_amount ELSE 0 END), 0) as total_personal,
          COALESCE(SUM(CASE WHEN nc.id IS NOT NULL AND nc.paid = false AND s2.status = 'approved' THEN nc.commission_amount ELSE 0 END), 0) as total_network,
          COALESCE(SUM(CASE WHEN pc.id IS NOT NULL AND pc.paid = false AND s1.status = 'approved' THEN pc.commission_amount ELSE 0 END), 0) +
          COALESCE(SUM(CASE WHEN nc.id IS NOT NULL AND nc.paid = false AND s2.status = 'approved' THEN nc.commission_amount ELSE 0 END), 0) as total_amount,
          COUNT(DISTINCT CASE WHEN (pc.paid = false AND s1.status = 'approved') OR (nc.paid = false AND s2.status = 'approved') THEN COALESCE(pc.id, nc.id) END) as commissions_count,
          MIN(COALESCE(pc.created_at, nc.created_at)) as oldest_commission,
          MAX(COALESCE(pc.created_at, nc.created_at)) as latest_commission
        FROM users u
        LEFT JOIN personal_commissions pc ON u.id = pc.user_id AND pc.paid = false
        LEFT JOIN sales s1 ON pc.sale_id = s1.id AND s1.status = 'approved'
        LEFT JOIN network_commissions nc ON u.id = nc.leader_id AND nc.paid = false
        LEFT JOIN sales s2 ON nc.sale_id = s2.id AND s2.status = 'approved'
        WHERE ((pc.id IS NOT NULL AND s1.status = 'approved') OR (nc.id IS NOT NULL AND s2.status = 'approved'))
          AND u.is_active = true
        GROUP BY u.id, u.name, u.email, u.pix_type, u.pix_key
        HAVING COALESCE(SUM(CASE WHEN pc.id IS NOT NULL AND s1.status = 'approved' THEN pc.commission_amount ELSE 0 END), 0) +
               COALESCE(SUM(CASE WHEN nc.id IS NOT NULL AND s2.status = 'approved' THEN nc.commission_amount ELSE 0 END), 0) > 0
        ORDER BY total_amount DESC
      `);

      logger.info(`✅ [PIX-DEBUG] Query executada! Total de usuários encontrados: ${result.rows.length}`);
      
      // Log detalhado de cada usuário
      result.rows.forEach((row, index) => {
        logger.info(`\n📊 [PIX-DEBUG] Usuário ${index + 1}:`);
        logger.info(`   👤 Nome: ${row.user_name}`);
        logger.info(`   🆔 ID: ${row.user_id}`);
        logger.info(`   💰 Comissão Pessoal: R$ ${parseFloat(row.total_personal).toFixed(2)}`);
        logger.info(`   🌐 Comissão Rede: R$ ${parseFloat(row.total_network).toFixed(2)}`);
        logger.info(`   💵 TOTAL: R$ ${parseFloat(row.total_amount).toFixed(2)}`);
        logger.info(`   📝 Quantidade de comissões: ${row.commissions_count}`);
        logger.info(`   🔑 PIX Key: ${row.pix_key || '❌ NÃO CADASTRADA'}`);
        logger.info(`   ${row.pix_verified ? '✅' : '⚠️'} PIX ${row.pix_verified ? 'Verificado' : 'NÃO Verificado'}`);
      });

      // Gerar QR Code PIX para cada usuário que possui chave PIX
      const commissions = await Promise.all(result.rows.map(async (row: any) => {
        if (row.pix_key && row.total_amount > 0) {
          logger.info(`🔄 [PIX-DEBUG] Gerando QR Code para ${row.user_name}...`);
          const pixData = await this.generatePixPayload(
            row.pix_key,
            parseFloat(row.total_amount),
            row.user_name
          );
          row.qr_code_payload = pixData.payload;
          row.qr_code_base64 = pixData.qrCodeBase64;
          logger.info(`✅ [PIX-DEBUG] QR Code gerado com sucesso!`);
        } else {
          logger.warn(`⚠️ [PIX-DEBUG] ${row.user_name} - Sem PIX ou valor = 0. Pulando geração de QR Code.`);
        }
        return row;
      }));

      logger.info(`\n🎯 [PIX-DEBUG] RESULTADO FINAL: ${commissions.length} usuário(s) retornado(s) para aba Pagamentos PIX\n`);
      return commissions;
    } catch (error) {
      logger.error('Erro ao buscar comissões pendentes:', error);
      throw error;
    }
  }

  // Buscar detalhes das comissões de um usuário
  async getUserCommissionDetails(userId: string): Promise<CommissionDetail[]> {
    try {
      const result = await pool.query(`
        SELECT 
          'personal' as type,
          pc.id,
          pc.sale_id,
          s.value as sale_value,
          pc.commission_percentage,
          pc.commission_amount,
          s.created_at as sale_date,
          s.client_name,
          s.status as sale_status
        FROM personal_commissions pc
        JOIN sales s ON pc.sale_id = s.id
        WHERE pc.user_id = $1 AND pc.paid = false AND s.status = 'approved'
        
        UNION ALL
        
        SELECT 
          'network' as type,
          nc.id,
          nc.sale_id,
          s.value as sale_value,
          nc.commission_percentage,
          nc.commission_amount,
          s.created_at as sale_date,
          s.client_name,
          s.status as sale_status
        FROM network_commissions nc
        JOIN sales s ON nc.sale_id = s.id
        WHERE nc.leader_id = $1 AND nc.paid = false AND s.status = 'approved'
        
        ORDER BY sale_date DESC
      `, [userId]);

      return result.rows;
    } catch (error) {
      logger.error('Erro ao buscar detalhes das comissões:', error);
      throw error;
    }
  }

  // Gerar payload PIX válido usando biblioteca pix-utils
  async generatePixPayload(pixKey: string, amount: number, recipientName: string): Promise<{payload: string, qrCodeBase64: string}> {
    try {
      // Criar payload PIX usando pix-utils
      const pix = pixUtils.createStaticPix({
        merchantName: recipientName.substring(0, 25),
        merchantCity: 'BRASILIA',
        pixKey: pixKey,
        infoAdicional: 'Pagamento Comissao',
        txid: crypto.randomBytes(16).toString('hex').substring(0, 25),
        transactionAmount: amount,
      });

      // Verificar se houve erro
      if ('error' in pix) {
        throw new Error('Erro ao gerar PIX');
      }

      // Obter payload
      const payload = pix.toBRCode();

      // Gerar QR Code em base64
      const qrCodeBase64 = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 1,
      });

      return { payload, qrCodeBase64 };
    } catch (error) {
      logger.error('Erro ao gerar QR Code PIX:', error);
      // Fallback para payload simples em caso de erro
      const payload = `PIX-${pixKey}-${amount}`;
      return { payload, qrCodeBase64: '' };
    }
  }

  // Criar pagamento de comissões
  async createPayment(
    userId: string,
    processedBy: string,
    paymentMethod: 'pix' | 'bank_transfer',
    notes?: string,
    commissionIds?: string[]
  ): Promise<{ paymentId: string; qrCode: any }> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Buscar dados do usuário e PIX
      const userResult = await client.query(`
        SELECT u.id, u.name, u.email, u.pix_type, u.pix_key,
               CASE WHEN u.pix_key IS NOT NULL AND u.pix_key != '' THEN true ELSE false END as pix_verified
        FROM users u
        WHERE u.id = $1
      `, [userId]);

      if (userResult.rows.length === 0) {
        throw new Error('Usuário não encontrado');
      }

      const user = userResult.rows[0];

      // Buscar comissões pendentes (específicas ou todas)
      let personalComms, networkComms;
      
      if (commissionIds && commissionIds.length > 0) {
        // Buscar apenas comissões especificadas
        personalComms = await client.query(`
          SELECT id, commission_amount
          FROM personal_commissions
          WHERE user_id = $1 AND paid = false AND id = ANY($2)
        `, [userId, commissionIds]);

        networkComms = await client.query(`
          SELECT id, commission_amount
          FROM network_commissions
          WHERE leader_id = $1 AND paid = false AND id = ANY($2)
        `, [userId, commissionIds]);
      } else {
        // Buscar todas as comissões pendentes
        personalComms = await client.query(`
          SELECT id, commission_amount
          FROM personal_commissions
          WHERE user_id = $1 AND paid = false
        `, [userId]);

        networkComms = await client.query(`
          SELECT id, commission_amount
          FROM network_commissions
          WHERE leader_id = $1 AND paid = false
        `, [userId]);
      }

      const totalPersonal = personalComms.rows.reduce((sum: number, c: any) => sum + parseFloat(c.commission_amount), 0);
      const totalNetwork = networkComms.rows.reduce((sum: number, c: any) => sum + parseFloat(c.commission_amount), 0);
      const totalAmount = totalPersonal + totalNetwork;
      const commissionsCount = personalComms.rows.length + networkComms.rows.length;

      if (totalAmount <= 0) {
        throw new Error('Nenhuma comissão pendente para pagamento');
      }
      
      logger.info(`💰 [PAYMENT] Calculando: Personal=${totalPersonal.toFixed(2)} + Network=${totalNetwork.toFixed(2)} = Total=${totalAmount.toFixed(2)}`);

      // Gerar QR Code PIX se método for PIX
      let qrCodePayload = null;
      if (paymentMethod === 'pix' && user.pix_key) {
        logger.info(`🎯 [QR-CODE] Gerando QR Code para ${user.name} | Valor: R$ ${totalAmount.toFixed(2)} | PIX: ${user.pix_key}`);
        const pixData = await this.generatePixPayload(user.pix_key, totalAmount, user.name);
        qrCodePayload = JSON.stringify(pixData);
        logger.info(`✅ [QR-CODE] Gerado com sucesso | Payload length: ${qrCodePayload.length}`);
      }

      // Coletar IDs das comissões
      const personalCommIds = personalComms.rows.map((c: any) => c.id);
      const networkCommIds = networkComms.rows.map((c: any) => c.id);
      const allCommissionIds = [...personalCommIds, ...networkCommIds];

      // Criar registro de pagamento
      const paymentResult = await client.query(`
        INSERT INTO commission_payments (
          user_id, paid_by, amount, commission_ids,
          payment_type, pix_key_type, pix_key, pix_qr_code,
          status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [
        userId,
        processedBy,
        totalAmount,
        allCommissionIds,
        paymentMethod,
        user.pix_type,
        user.pix_key,
        qrCodePayload,
        'pending',
        notes
      ]);

      const paymentId = paymentResult.rows[0].id;

      await client.query('COMMIT');
      
      logger.info(`💰 Pagamento de comissão criado: ${paymentId} | Usuário: ${user.name} | Valor: R$ ${totalAmount.toFixed(2)}`);
      
      // Retornar ID do pagamento + QR Code para exibição no frontend
      const qrCodeData = qrCodePayload ? JSON.parse(qrCodePayload) : null;
      logger.info(`📊 QR Code data: ${qrCodeData ? 'YES' : 'NO'} | Payload length: ${qrCodePayload?.length || 0}`);
      
      return {
        paymentId,
        qrCode: qrCodeData
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erro ao criar pagamento:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Confirmar pagamento e marcar comissões como pagas
  async confirmPayment(
    paymentId: string,
    transactionId: string,
    metadata?: any
  ): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Buscar dados completos do pagamento e usuário
      const paymentData = await client.query(`
        SELECT 
          cp.*,
          u.name as user_name,
          u.email as user_email
        FROM commission_payments cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.id = $1
      `, [paymentId]);

      if (paymentData.rows.length === 0) {
        throw new Error('Pagamento não encontrado');
      }

      const payment = paymentData.rows[0];
      const commissionIds = payment.commission_ids;

      // Atualizar status do pagamento
      await client.query(`
        UPDATE commission_payments
        SET status = 'paid',
            pix_transaction_id = $2,
            paid_at = NOW()
        WHERE id = $1
      `, [paymentId, transactionId]);

      // Marcar todas as comissões como pagas (tentando em ambas as tabelas)
      if (commissionIds && commissionIds.length > 0) {
        await client.query(`
          UPDATE personal_commissions
          SET paid = true, paid_at = NOW(), updated_at = NOW()
          WHERE id = ANY($1::uuid[])
        `, [commissionIds]);

        await client.query(`
          UPDATE network_commissions
          SET paid = true, paid_at = NOW(), updated_at = NOW()
          WHERE id = ANY($1::uuid[])
        `, [commissionIds]);
      }

      // Criar notificação interna para o usuário
      await client.query(`
        INSERT INTO notifications (
          user_id,
          type,
          title,
          message,
          is_read,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
      `, [
        payment.user_id,
        'custom',
        '💰 Pagamento PIX Recebido!',
        `Seu pagamento de R$ ${parseFloat(payment.amount).toFixed(2)} via PIX foi processado com sucesso. O valor deve aparecer em sua conta em até 5 minutos. ID: #${paymentId.substring(0, 8).toUpperCase()}`,
        false
      ]);

      await client.query('COMMIT');
      
      logger.info(`✅ Pagamento confirmado: ${paymentId} | Transação: ${transactionId}`);

      // Enviar email de notificação (fora da transação para não bloquear)
      try {
        const { emailService } = await import('../../services/email.service');
        await emailService.sendPixPaymentNotification(
          payment.user_email,
          payment.user_name,
          parseFloat(payment.amount),
          paymentId,
          commissionIds.length,
          new Date()
        );
        logger.info(`📧 Email de pagamento enviado para: ${payment.user_email}`);
      } catch (emailError) {
        logger.error('Erro ao enviar email de pagamento:', emailError);
        // Não falha a transação se o email falhar
      }

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Erro ao confirmar pagamento:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Buscar histórico de pagamentos
  async getPaymentHistory(filters?: {
    userId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    try {
      let query = `
        SELECT 
          cp.*,
          u.name as user_name,
          u.email as user_email,
          pb.name as paid_by_name
        FROM commission_payments cp
        JOIN users u ON cp.user_id = u.id
        LEFT JOIN users pb ON cp.paid_by = pb.id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      let paramIndex = 1;

      if (filters?.userId) {
        query += ` AND cp.user_id = $${paramIndex}`;
        params.push(filters.userId);
        paramIndex++;
      }

      if (filters?.status) {
        query += ` AND cp.status = $${paramIndex}`;
        params.push(filters.status);
        paramIndex++;
      }

      if (filters?.startDate) {
        query += ` AND cp.created_at >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }

      if (filters?.endDate) {
        query += ` AND cp.created_at <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }

      query += ` ORDER BY cp.created_at DESC`;

      if (filters?.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
        paramIndex++;
      }

      if (filters?.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
      }

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Erro ao buscar histórico de pagamentos:', error);
      throw error;
    }
  }

  // Cancelar pagamento
  async cancelPayment(paymentId: string, reason: string): Promise<void> {
    try {
      await pool.query(`
        UPDATE commission_payments
        SET status = 'cancelled',
            notes = CONCAT(COALESCE(notes, ''), '\nCancelado: ', $2),
            updated_at = NOW()
        WHERE id = $1 AND status = 'pending'
      `, [paymentId, reason]);

      logger.info(`❌ Pagamento cancelado: ${paymentId} | Motivo: ${reason}`);
    } catch (error) {
      logger.error('Erro ao cancelar pagamento:', error);
      throw error;
    }
  }

  // Buscar detalhes de um pagamento específico
  async getPaymentById(paymentId: string): Promise<any> {
    try {
      const result = await pool.query(`
        SELECT 
          cp.*,
          u.name as user_name,
          u.email as user_email,
          pb.name as paid_by_name
        FROM commission_payments cp
        JOIN users u ON cp.user_id = u.id
        LEFT JOIN users pb ON cp.paid_by = pb.id
        WHERE cp.id = $1
      `, [paymentId]);

      if (result.rows.length === 0) {
        throw new Error('Pagamento não encontrado');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Erro ao buscar pagamento:', error);
      throw error;
    }
  }
}
