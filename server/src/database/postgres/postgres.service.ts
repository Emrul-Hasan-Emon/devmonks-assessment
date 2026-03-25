import { Injectable, OnApplicationBootstrap } from '@nestjs/common';

@Injectable()
export class PostgresService {
  // persons: Repository<Person>;

  constructor() // @InjectRepository(Person)
  // private personRepository: Repository<Person>,
  {}
  onApplicationBootstrap() {
    // this.persons = this.personRepository;
  }
}
