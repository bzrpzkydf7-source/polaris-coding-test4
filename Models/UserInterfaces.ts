export interface User {
    userRole: string;
    firstName: string;
    surname: string;
    email: string;
    password: string;
}

export interface Users {
    [key: string]: User;
    admin: User;
    customer: User;
    customer2: User;
    customer3: User;
}