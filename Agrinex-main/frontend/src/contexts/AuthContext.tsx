import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export interface Farm {
  id: string;
  name: string;
  location: string;
  coordinates: string;
  area: number; // in acres
  cropType?: string;
  soilType?: string;
  moisture?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  farms: Farm[];
  selectedFarmId?: string; // Currently selected farm for viewing
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  addFarm: (farm: Farm) => void;
  updateFarm: (farmId: string, farmData: Partial<Farm>) => void;
  deleteFarm: (farmId: string) => void;
  selectFarm: (farmId: string) => void;
  getSelectedFarm: () => Farm | null;
  getSelectedFarmZoneLocks: () => Array<{ id: string; crop: string; area: number; estimatedCostPerAcre: number; expectedRevenuePerAcre: number }>;
  setSelectedFarmZoneLocks: (locks: Array<{ id: string; crop: string; area: number; estimatedCostPerAcre: number; expectedRevenuePerAcre: number }>) => void;
  addSelectedFarmZoneLock: (lock: { id: string; crop: string; area: number; estimatedCostPerAcre: number; expectedRevenuePerAcre: number }) => void;
  removeSelectedFarmZoneLock: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('agrinex_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      if (parsedUser.farms && parsedUser.farms.length > 0 && !parsedUser.selectedFarmId) {
        parsedUser.selectedFarmId = parsedUser.farms[0].id;
        setUser(parsedUser);
        localStorage.setItem('agrinex_user', JSON.stringify(parsedUser));
      }
    }
  }, []);
  useEffect(() => {
    const sync = async () => {
      if (!db || !user?.email) return;
      try {
        const u = await getDoc(doc(db, 'users', user.email));
        const udata = u.exists() ? u.data() : null;
        const qs = query(collection(db, 'farms'), where('owner', '==', user.email));
        const fs = await getDocs(qs);
        const farms = fs.docs.map(d => {
          const data = d.data() as any;
          return {
            id: data.id || d.id,
            name: data.name || 'Farm',
            location: data.location || '',
            coordinates: data.coordinates || '',
            area: Number(data.area ?? 0),
            cropType: data.cropType,
            soilType: data.soilType,
            moisture: typeof data.moisture === 'number' ? data.moisture : undefined,
          } as Farm;
        });
        const updated = {
          ...user,
          ...(udata || {}),
          farms: farms.length > 0 ? farms : user.farms,
        } as User;
        if (!updated.selectedFarmId && updated.farms && updated.farms.length > 0) {
          updated.selectedFarmId = updated.farms[0].id;
        }
        setUser(updated);
        localStorage.setItem('agrinex_user', JSON.stringify(updated));
      } catch {}
    };
    sync();
  }, [user?.email]);

  const login = (userData: User) => {
    // Set first farm as selected if not specified
    if (userData.farms && userData.farms.length > 0 && !userData.selectedFarmId) {
      userData.selectedFarmId = userData.farms[0].id;
    }
    setUser(userData);
    localStorage.setItem('agrinex_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('agrinex_user');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('agrinex_user', JSON.stringify(updatedUser));
    }
  };

  const addFarm = (farm: Farm) => {
    if (user) {
      const updatedUser = {
        ...user,
        farms: [...user.farms, farm],
        selectedFarmId: user.selectedFarmId || farm.id,
      };
      setUser(updatedUser);
      localStorage.setItem('agrinex_user', JSON.stringify(updatedUser));
    }
  };

  const updateFarm = (farmId: string, farmData: Partial<Farm>) => {
    if (user) {
      const updatedUser = {
        ...user,
        farms: user.farms.map(farm => farm.id === farmId ? { ...farm, ...farmData } : farm),
      };
      setUser(updatedUser);
      localStorage.setItem('agrinex_user', JSON.stringify(updatedUser));
    }
  };

  const deleteFarm = (farmId: string) => {
    if (user && user.farms.length > 1) {
      const updatedFarms = user.farms.filter(farm => farm.id !== farmId);
      const updatedUser = {
        ...user,
        farms: updatedFarms,
        selectedFarmId: updatedFarms.length > 0 ? updatedFarms[0].id : undefined,
      };
      setUser(updatedUser);
      localStorage.setItem('agrinex_user', JSON.stringify(updatedUser));
    }
  };

  const selectFarm = (farmId: string) => {
    if (user) {
      const updatedUser = { ...user, selectedFarmId: farmId };
      setUser(updatedUser);
      localStorage.setItem('agrinex_user', JSON.stringify(updatedUser));
    }
  };

  const getSelectedFarm = (): Farm | null => {
    if (!user || !user.selectedFarmId) return null;
    return user.farms.find(farm => farm.id === user.selectedFarmId) || null;
  };
  const getSelectedFarmZoneLocks = () => {
    const farm = getSelectedFarm();
    if (!farm) return [];
    const key = `agrinex_zone_locks_${farm.id}`;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };
  const setSelectedFarmZoneLocks = (locks: Array<{ id: string; crop: string; area: number; estimatedCostPerAcre: number; expectedRevenuePerAcre: number }>) => {
    const farm = getSelectedFarm();
    if (!farm) return;
    const key = `agrinex_zone_locks_${farm.id}`;
    localStorage.setItem(key, JSON.stringify(locks));
  };
  const addSelectedFarmZoneLock = (lock: { id: string; crop: string; area: number; estimatedCostPerAcre: number; expectedRevenuePerAcre: number }) => {
    const locks = getSelectedFarmZoneLocks();
    const idx = locks.findIndex(l => l.id === lock.id);
    if (idx >= 0) {
      locks[idx] = lock;
      setSelectedFarmZoneLocks([...locks]);
    } else {
      setSelectedFarmZoneLocks([...locks, lock]);
    }
  };
  const removeSelectedFarmZoneLock = (id: string) => {
    const locks = getSelectedFarmZoneLocks();
    setSelectedFarmZoneLocks(locks.filter(l => l.id !== id));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout,
      updateUser,
      addFarm,
      updateFarm,
      deleteFarm,
      selectFarm,
      getSelectedFarm,
      getSelectedFarmZoneLocks,
      setSelectedFarmZoneLocks,
      addSelectedFarmZoneLock,
      removeSelectedFarmZoneLock,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

