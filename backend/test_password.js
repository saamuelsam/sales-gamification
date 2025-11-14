const bcrypt = require('bcryptjs');

const password = 'admin123';
const hash = '$2a$10$rY8qQWKvJZ5kXhKvYqXrHe0OZxZ5qX9pKL1pQHvFG8ZqV9qWkJYXK';

console.log('Testando senha:', password);
console.log('Hash:', hash);

bcrypt.compare(password, hash, (err, result) => {
  if (err) {
    console.error('Erro:', err);
    return;
  }
  console.log('Resultado da comparação:', result);
  console.log(result ? '✅ SENHA CORRETA!' : '❌ SENHA INCORRETA!');
});

// Testar gerando um novo hash
bcrypt.hash(password, 10, (err, newHash) => {
  if (err) {
    console.error('Erro ao gerar hash:', err);
    return;
  }
  console.log('\nNovo hash gerado:', newHash);
  
  bcrypt.compare(password, newHash, (err, result) => {
    if (err) {
      console.error('Erro:', err);
      return;
    }
    console.log('Teste com novo hash:', result ? '✅ OK' : '❌ FALHOU');
  });
});
