// src/routes/auth.js
const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const { limiterLogin, limiterCadastro } = require('../middlewares/rateLimiter');
const { autenticar } = require('../middlewares/auth');

const validarCadastro = [
  body('nome').trim().isLength({ min: 2, max: 100 }).withMessage('Nome deve ter 2-100 caracteres.'),
  body('email').isEmail().normalizeEmail().withMessage('E-mail inválido.'),
  body('senha').isLength({ min: 8 }).withMessage('Senha deve ter ao menos 8 caracteres.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter letras maiúsculas, minúsculas e números.'),
  body('lgpdAceito').equals('true').withMessage('Aceite os termos de privacidade.')
];

const validarLogin = [
  body('email').isEmail().normalizeEmail().withMessage('E-mail inválido.'),
  body('senha').notEmpty().withMessage('Senha obrigatória.')
];

router.post('/cadastro', limiterCadastro, validarCadastro, ctrl.cadastrar);
router.post('/login',    limiterLogin,    validarLogin,   ctrl.login);
router.post('/refresh',  ctrl.refreshToken);
router.post('/logout',   autenticar,      ctrl.logout);
router.delete('/conta',  autenticar,      ctrl.excluirConta); // LGPD Art. 18 VI

module.exports = router;
