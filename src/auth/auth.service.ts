import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto, RegisterUserDto , LoginDto, UpdateAuthDto} from './dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';
import * as bcryptjs from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload';
import { LoginResponse } from './interfaces/login-response';
import { CONFIGURABLE_MODULE_ID } from '@nestjs/common/module-utils/constants';

@Injectable()
export class AuthService {

  constructor(@InjectModel(User.name)
  private userModel: Model<User>,
  private jwtService: JwtService,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    
    try {
      const {password, ...userData} = createUserDto;
      const newUser = new this.userModel({
        password: bcryptjs.hashSync(password, 10),
        ...userData
      });

       await newUser.save();
       const { password:_, ... user} = newUser.toJSON();
       return user;

    } catch (error) {
      if(error.code === 11000){
        throw new BadRequestException(`${ createUserDto.email} already exists`);
      }
      throw new InternalServerErrorException('ALgo malo ha pasao')
    }
  }

  async register(registerUserDto: RegisterUserDto): Promise<LoginResponse>{

    const user =  await this.create( registerUserDto );

    return{
      user: user,
      token: this.getJWToken({ id: user._id})
    }
  }


  async login( loginDto: LoginDto){
    console.log({loginDto});
    const {email, password} = loginDto;
    const user = await this.userModel.findOne({email})
    if(!user){
      throw new UnauthorizedException('Usuario sin credenciales validas - email jodido');
    }
    if (!bcryptjs.compareSync(password, user.password)){
      throw new UnauthorizedException('Not valid password');
    }

    const {password:_, ...rest} = user.toJSON();
    return {
      user: rest,
      token: this.getJWToken({id: user.id}),
    }
  }

  findAll(): Promise<User[]> {
    return this.userModel.find()
  }

  async findUserById(id: string){
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

  getJWToken( payload: JwtPayload){
    const token = this.jwtService.sign(payload);
    return token;
  }
}
