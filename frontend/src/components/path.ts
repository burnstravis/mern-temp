const app_name = 'localhost:3000';

export const buildPath = (route: string): string => {

    if (import.meta.env.MODE !== 'development') {
        return 'https://' + app_name + '/' + route;
    } else {
        return 'http://localhost:3000/' + route;
    }
};