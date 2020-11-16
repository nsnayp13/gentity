import { Entity, Column, OneToMany } from "typeorm";
import Product from "./product.entity.ts";

@Entity()
class Category {

    @Column()
    title: string;

    @OneToMany(() => Product, product => product.category)
    users: Product[];
}
