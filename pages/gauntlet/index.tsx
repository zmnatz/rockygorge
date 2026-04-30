import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function GauntletIndex() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/gauntlet/current');
    }, [router]);

    return null;
}
