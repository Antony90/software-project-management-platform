export default interface mTask<UserType> {
    name: string;
    subtasks: mTask<UserType>[];
    developers: UserType[];

    optimistic: number;
    mostLikely: number;
    pessimistic: number;
}