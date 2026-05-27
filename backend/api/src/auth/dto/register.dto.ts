import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'Username: only letters, numbers, _ and -' })
  username: string;

  @IsString()
  @MinLength(8)
  @Matches(/(?=.*\d)/, { message: 'Password must contain at least one number' })
  password: string;
}
