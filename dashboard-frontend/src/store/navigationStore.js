import { create } from 'zustand';
import { applicationsApi, infrastructureApi, skeEnvironmentsApi } from '../api/services';

const useNavigationStore = create((set, get) => ({
    applications: [],
    infrastructure: [],
    skeEnvironments: [],
    loading: false,
    error: null,

    refreshAll: async () => {
        set({ loading: true, error: null });
        try {
            const [appsRes, infraRes, skeRes] = await Promise.all([
                applicationsApi.getApplications(),
                infrastructureApi.getInfrastructureGroups(),
                skeEnvironmentsApi.getEnvironments()
            ]);
            
            set({
                applications: appsRes.data || [],
                infrastructure: infraRes.data || [],
                skeEnvironments: skeRes.data || [],
                loading: false
            });
        } catch (err) {
            console.error("Navigation store failed to refresh", err);
            set({ error: err.message, loading: false });
        }
    }
}));

export default useNavigationStore;
