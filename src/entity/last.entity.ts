@Entity()
class Last {
    @OneToOne(() => Department)
    @JoinColumn
    photo: Type;
}
