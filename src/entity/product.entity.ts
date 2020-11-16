import { Entity, Column, ManyToOne } from "typeorm";
import Category from "./entity.Category.ts";

@Entity()
class Product {

    @Column()
    title: string;

    @Column()
    weight: integer;

    @ManyToOne(type => Category, category => category.category)
    Category: Category;
}
