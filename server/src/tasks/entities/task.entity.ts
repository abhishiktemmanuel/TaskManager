import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Todo } from './todo.entity';
import { Priority } from '../interfaces/priority.enum';
import { Status } from '../interfaces/status.enum';
import { Team } from '../../users/entities/team.entity';

@Entity()
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  priority: Priority;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.PENDING,
  })
  status: Status;

  @Column({ type: 'date' })
  dueDate: Date;

  @ManyToOne(() => User, (user) => user.assignedTasks)
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo: User;

  @ManyToOne(() => User, (user) => user.createdTasks)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  // Task belongs to a team
  @ManyToOne(() => Team, (team) => team.tasks)
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ name: 'team_id' })
  teamId: number;

  @Column({ default: 0 })
  progress: number;

  @OneToMany(() => Todo, (todo) => todo.task, { cascade: true })
  todos: Todo[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
