// src/routes/dividas.js
const router = require('express').Router();
const { body, param } = require('express-validator');
const ctrl = require('../controllers/dividasController');
const { autenticar } = require('../middlewares/auth');

const validarDivida = [
  body('tipo').isIn(['minha', 'terceiro']).withMessage('Tipo inválido.'),
  body('descricao').trim().isLength({ min: 2, max: 300 }).withMessage('Descrição inválida.'),
  body('valor').isFloat({ min: 0.01 }).withMessage('Valor deve ser maior que zero.'),
  body('parcelas').optional().isInt({ min: 1, max: 360 }).withMessage('Parcelas inválidas.'),
  body('pessoaNome').optional().trim().isLength({ max: 100 }),
  body('observacao').optional().trim().isLength({ max: 500 })
];

const validarId = [param('id').isUUID().withMessage('ID inválido.')];

// Todas as rotas exigem autenticação
router.use(autenticar);

router.get('/',           ctrl.listar);
router.get('/resumo',     ctrl.resumo);
router.post('/',          validarDivida, ctrl.criar);
router.put('/:id',              [...validarId], ctrl.atualizar);
router.post('/:id/parcela',     validarId,      ctrl.pagarParcela);
router.delete('/:id',           validarId,      ctrl.excluir);

module.exports = router;
