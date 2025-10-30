import Joi from 'joi';

export const createSaleSchema = Joi.object({
  client_id: Joi.string().uuid().optional(),
  client_name: Joi.string().required(),
  value: Joi.number().positive().required(),
  kilowatts: Joi.number().positive().required(),
  insurance_value: Joi.number().positive().optional(),
  sale_type: Joi.string().valid('direct', 'consortium', 'cash', 'card').default('direct'),
  consortium_value: Joi.number().positive().optional(),
  consortium_term: Joi.number().integer().positive().optional(),
  consortium_monthly_payment: Joi.number().positive().optional(),
  consortium_admin_fee: Joi.number().positive().optional(),
  template_type: Joi.string().optional(),
  notes: Joi.string().optional(),
  status: Joi.string().valid(
    'negotiation',
    'pending',
    'approved',
    'financing_denied',
    'cancelled',
    'delivered'
  ).default('pending'),
});

export const updateSaleSchema = Joi.object({
  value: Joi.number().positive().optional(),
  kilowatts: Joi.number().positive().optional(),
  insurance_value: Joi.number().positive().optional(),
  sale_type: Joi.string().valid('direct', 'consortium', 'cash', 'card').optional(),
  consortium_value: Joi.number().positive().optional(),
  consortium_term: Joi.number().integer().positive().optional(),
  consortium_monthly_payment: Joi.number().positive().optional(),
  consortium_admin_fee: Joi.number().positive().optional(),
  template_type: Joi.string().optional(),
  notes: Joi.string().optional(),
  status: Joi.string().valid(
    'negotiation',
    'pending',
    'approved',
    'financing_denied',
    'cancelled',
    'delivered'
  ).optional(),
});
