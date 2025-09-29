import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Task } from './task.entity';

@Entity()
export class Todo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;

  @Column({ default: false })
  completed: boolean;

  @ManyToOne(() => Task, (task) => task.todos, { onDelete: 'CASCADE' })
  task: Task;
}
