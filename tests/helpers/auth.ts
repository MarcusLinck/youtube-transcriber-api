import type { FastifyInstance } from 'fastify'
import { Pool } from 'pg'

const TEST_USER = {
  firstName: 'Usuário',
  lastName: 'Teste',
  email: 'test@example.com',
  password: 'senha-teste-123',
}

async function promoteTestUserToAdmin(email: string): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  try {
    await pool.query('UPDATE users SET role = $1 WHERE email = $2', ['admin', email])
  } finally {
    await pool.end()
  }
}

export async function getAuthHeaders(
  app: FastifyInstance,
): Promise<{ headers: { authorization: string } }> {
  let response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-in',
    payload: { email: TEST_USER.email, password: TEST_USER.password },
  })

  if (response.statusCode !== 200) {
    const signUp = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/sign-up',
      payload: { ...TEST_USER, confirmPassword: TEST_USER.password },
    })

    if (signUp.statusCode === 201) {
      await app.inject({
        method: 'POST',
        url: '/api/v1/auth/confirm',
        payload: { token: signUp.json().user.confirmation_token },
      })
    }

    response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/sign-in',
      payload: { email: TEST_USER.email, password: TEST_USER.password },
    })
  }

  if (response.statusCode !== 200) {
    throw new Error('Falha ao obter token de autenticação de teste.')
  }

  await promoteTestUserToAdmin(TEST_USER.email)

  response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/sign-in',
    payload: { email: TEST_USER.email, password: TEST_USER.password },
  })

  if (response.statusCode !== 200) {
    throw new Error('Falha ao obter token de autenticação de teste.')
  }

  return {
    headers: {
      authorization: `Bearer ${response.json().token}`,
    },
  }
}