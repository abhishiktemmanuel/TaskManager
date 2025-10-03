import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';
import { UserRole } from '../interfaces/user-role.enum';
import { Team } from './team.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  profileImageURL: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  // Many-to-many relationship with teams - REMOVE @JoinTable from here
  @ManyToMany(() => Team, (team) => team.members)
  teams: Team[]; // Remove the @JoinTable decorator and its configuration

  // Track which teams this user owns (if they're an admin)
  @OneToMany(() => Team, (team) => team.owner)
  ownedTeams: Team[];

  @OneToMany(() => Task, (task) => task.assignedTo)
  assignedTasks: Task[];

  @OneToMany(() => Task, (task) => task.createdBy)
  createdTasks: Task[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
