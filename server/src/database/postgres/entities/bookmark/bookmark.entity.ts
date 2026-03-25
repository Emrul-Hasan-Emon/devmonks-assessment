import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Bookmark {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint' })
  storyId: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
