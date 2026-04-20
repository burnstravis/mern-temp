const app_name = 'largeproject.nathanfoss.me';

export const buildPath = (route: string): string => {
    if (import.meta.env.MODE !== 'development') {
        return 'https://' + app_name + '/' + route;
    }

    return 'http://localhost:3000/' + route;
};