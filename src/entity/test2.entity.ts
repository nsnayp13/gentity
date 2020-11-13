import Entity from "typeorm";
import User from "./user.entity.ts";
import OneToMany from "typeorm";

@Entity()
class Test2 {
    @OneToMany(() => User, user => user.test2)
    users: User[];
}
