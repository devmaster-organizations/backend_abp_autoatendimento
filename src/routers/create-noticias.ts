import { Router } from "express";


const router = Router();

router.post('/', (req, res) => {
  const { title, content } = req.body;

  // Aqui você pode adicionar a lógica para salvar a notícia no banco de dados
  // Por exemplo, usando um modelo Prisma ou uma consulta SQL

  res.status(201).json({ message: 'Notícia criada com sucesso', data: { title, content } });
});

export default router;