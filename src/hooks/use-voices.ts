import { useState, useEffect, useCallback } from 'react';
import { voiceAPI, Voice, VoicesResponse } from '@/lib/apiService';

export interface UseVoicesOptions {
  autoLoad?: boolean;
  recommendedOnly?: boolean;
  provider?: string;
  gender?: string;
}

export function useVoices(options: UseVoicesOptions = {}) {
  const { autoLoad = true, recommendedOnly = false, provider, gender } = options;
  
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchVoices = useCallback(async (page = 1, searchTerm?: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔊 Fetching voices...', { page, searchTerm, recommendedOnly, provider, gender });

      const params: Record<string, string | number | boolean> = { page };
      
      if (searchTerm) params.search = searchTerm;
      if (recommendedOnly) params.recommend = true;
      if (provider) params.provider = provider;
      if (gender) params.gender = gender;

      const response: VoicesResponse = await voiceAPI.getVoices(params);
      console.log('✅ Voices loaded:', response);

      // Set voices (replace or append based on page)
      if (page === 1) {
        setVoices(response.results);
      } else {
        setVoices(prev => [...prev, ...response.results]);
      }
      
      setTotalCount(response.count);
      setCurrentPage(page);
    } catch (err) {
      console.error('❌ Failed to fetch voices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load voices');
    } finally {
      setLoading(false);
    }
  }, [recommendedOnly, provider, gender]);

  // Auto-load voices on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      fetchVoices();
    }
  }, [autoLoad, fetchVoices]);

  const loadMore = () => {
    if (!loading && voices.length < totalCount) {
      fetchVoices(currentPage + 1);
    }
  };

  const search = (searchTerm: string) => {
    fetchVoices(1, searchTerm);
  };

  const refresh = () => {
    fetchVoices(1);
  };

  // Get recommended voices
  const getRecommendedVoices = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🌟 Fetching recommended voices...');
      
      const recommendedVoices = await voiceAPI.getRecommendedVoices();
      console.log('✅ Recommended voices loaded:', recommendedVoices);
      
      setVoices(recommendedVoices);
      setTotalCount(recommendedVoices.length);
      setCurrentPage(1);
    } catch (err) {
      console.error('❌ Failed to fetch recommended voices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load recommended voices');
    } finally {
      setLoading(false);
    }
  };

  // Group voices by provider
  const voicesByProvider = voices.reduce((acc, voice) => {
    if (!acc[voice.provider]) {
      acc[voice.provider] = [];
    }
    acc[voice.provider].push(voice);
    return acc;
  }, {} as Record<string, Voice[]>);

  // Filter functions
  const filterByGender = (targetGender: string) => {
    return voices.filter(voice => voice.gender === targetGender);
  };

  const filterByProvider = (targetProvider: string) => {
    return voices.filter(voice => voice.provider === targetProvider);
  };

  const recommendedVoices = voices.filter(voice => voice.recommend);

  // Voice lookup functions
  const getVoiceById = (voiceId: string) => {
    return voices.find(voice => voice.id === voiceId);
  };

  const getVoiceName = (voiceId: string) => {
    const voice = getVoiceById(voiceId);
    return voice?.name || voiceId;
  };

  const getVoicePicture = (voiceId: string) => {
    const voice = getVoiceById(voiceId);
    return voice?.voice_picture || null;
  };

  const getVoiceProvider = (voiceId: string) => {
    const voice = getVoiceById(voiceId);
    return voice?.provider || null;
  };

  return {
    voices,
    voicesByProvider,
    recommendedVoices,
    loading,
    error,
    totalCount,
    currentPage,
    hasMore: voices.length < totalCount,
    // Actions
    fetchVoices,
    loadMore,
    search,
    refresh,
    getRecommendedVoices,
    // Filters
    filterByGender,
    filterByProvider,
    // Lookup functions
    getVoiceById,
    getVoiceName,
    getVoicePicture,
    getVoiceProvider
  };
} 