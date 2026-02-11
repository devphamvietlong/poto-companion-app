import axiosInstance from '../utils/axios';

export interface BambooInfo {
    bambooId: string;
    bambooName?: string;
    commonName: string;
    regionName: string;
    location: { lat: number; lng: number };
    datePlanted: string;
    activatedAt: string;
    daysOld: number;
    co2_kg: string;
    status: 'scheduled' | 'growing' | 'harvested' | 'failed';
    harvestedDate?: string | null;
    ownerId?: string | null;
    isOwner?: boolean;
    isFollowing?: boolean;
}

export const bambooService = {
    async getInfo(bambooId: string, batchId: string, sig: string): Promise<BambooInfo> {
        const res = await axiosInstance.get('/bamboo/info', {
            params: { bambooId, batchId, sig }
        });
        return res.data;
    },

    async follow(bambooId: string): Promise<void> {
        await axiosInstance.post('/bamboo/follow', { bambooId });
    },

    async unfollow(bambooId: string): Promise<void> {
        await axiosInstance.post('/bamboo/unfollow', { bambooId });
    },

    async claim(bambooId: string, name?: string): Promise<void> {
        await axiosInstance.post('/bamboo/claim', { bambooId, name });
    },

    async rename(bambooId: string, name: string): Promise<void> {
        await axiosInstance.put(`/bamboo/${bambooId}/rename`, { name });
    },

    async getMyBamboo(): Promise<{ owned: any[], followed: any[] }> {
        const res = await axiosInstance.get('/auth/me/bamboo');
        return res.data;
    }
};
