import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class StorySummary {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', unique: true })
  storyId: number;

  @Column({ type: 'text' })
  summary: string;

  @Column('text', { array: true })
  keyPoints: string[];

  @Column({ type: 'varchar', length: 20 })
  sentiment: 'positive' | 'negative' | 'mixed' | 'neutral';

  @Column({ type: 'varchar', length: 100, nullable: true })
  model?: string;

  @Column({ type: 'int', nullable: true })
  tokensUsed?: number;

  @Column({ type: 'int', nullable: true })
  lastCommentCount?: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
