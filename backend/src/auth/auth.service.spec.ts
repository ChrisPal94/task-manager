import { UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import * as bcrypt from 'bcryptjs'
import { UsersService } from '../users/users.service'
import { AuthService } from './auth.service'

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}))

const mockUser = {
  id: 'uuid-mario',
  name: 'Mario',
  email: 'mario@taskmanager.dev',
  password: 'hashed-password',
  created_at: new Date(),
  updated_at: new Date(),
  tasks: [],
}

const mockUsersService: jest.Mocked<Pick<UsersService, 'findByEmail'>> = {
  findByEmail: jest.fn(),
}

const mockJwtService: jest.Mocked<Pick<JwtService, 'sign'>> = {
  sign: jest.fn().mockReturnValue('signed-token'),
}

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile()

    service = module.get(AuthService)
    jest.clearAllMocks()
  })

  describe('login', () => {
    it('returns access_token and user on valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser as any)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const result = await service.login({
        email: 'mario@taskmanager.dev',
        password: 'Mario123!',
      })

      expect(result).toEqual({
        access_token: 'signed-token',
        user: { id: mockUser.id, name: mockUser.name, email: mockUser.email },
      })
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      })
    })

    it('throws UnauthorizedException when user does not exist', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null)

      await expect(
        service.login({ email: 'unknown@taskmanager.dev', password: 'any' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('throws UnauthorizedException when password is wrong', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser as any)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await expect(
        service.login({ email: mockUser.email, password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException)
    })
  })
})
