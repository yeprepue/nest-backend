import { BadRequestException, Injectable, InternalServerErrorException, Post, UnauthorizedException } from '@nestjs/common';

import * as bycryptjs from 'bcryptjs';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateAuthDto } from './dto/update-auth.dto';
// import { RegisterUserDto } from './dto/register-user.dto';
// import { LoginDto } from './dto/login.dto';

import { UpdateAuthDto } from './dto/update-auth.dto';
import { RegisterUserDto, CreateUserDto, LoginDto } from './dto';


import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';

import { Loginresponse } from './interfaces/login-response';

import { JwtPayLoad } from './interfaces/jwt-payload';
import { JwtService } from '@nestjs/jwt';

import { promises } from 'dns';



@Injectable()
export class AuthService {

  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService
  ) {

  }
  async create(CreateUserDto: CreateUserDto): Promise<User> {

    try {

      const { password, ...userData } = CreateUserDto;
      const newUser = new this.userModel({
        password: bycryptjs.hashSync(password, 10), ...userData
      });

      await newUser.save();
      const { password: _, ...user } = newUser.toJSON();
      return user;
   

    } catch (error) {

      // console.log(error.code)
      if (error.code === 11000) {
        throw new BadRequestException(`${CreateUserDto.email} already exist!`)
      }
      throw new InternalServerErrorException('algo terrible sucede!!!');
    }
  }

  async register(registerDto: RegisterUserDto): Promise<Loginresponse> {

    const user = await this.create(registerDto);

    return {
      user: user,
      token: this.getJwtToken({ id: user._id })
    }

  }
  async login(loginDto: LoginDto): Promise<Loginresponse> {

    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email })
    if (!user) {
      throw new UnauthorizedException('Email no valido');
    }

    if (!bycryptjs.compareSync(password, user.password)) {
      throw new UnauthorizedException('Password incorrecto');
    }

    const { password: _, ...rest } = user.toJSON();
    return {
      user: rest,
      token: this.getJwtToken({
        id: user.id,
        iat: 0
      }),
    }

  }

  findAll(): Promise<User[]> {
    return this.userModel.find();
  }

  async findUserById(id: string) {
    const user = await this.userModel.findById(id);
    const { password, ...rest } = user.toJSON();
    return rest;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }


  getJwtToken(payload: JwtPayLoad) {
    const token = this.jwtService.sign(payload);
    return token;
  }


}
