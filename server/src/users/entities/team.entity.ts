// src/users/entities/team.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Task } from '../../tasks/entities/task.entity';

@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => User, (user) => user.ownedTeams)
  owner: User;

  @Column()
  ownerId: number;

  @ManyToMany(() => User, (user) => user.teams)
  @JoinTable({
    name: 'user_teams',
    joinColumn: {
      name: 'team_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
  })
  members: User[];

  @OneToMany(() => Task, (task) => task.team)
  tasks: Task[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
