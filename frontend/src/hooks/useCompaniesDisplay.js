import { useState, useCallback } from 'react';

export const useCompaniesDisplay = () => {
  // Companies display state
  const [showSectorCompanies, setShowSectorCompanies] = useState(false);
  const [showIndustryCompanies, setShowIndustryCompanies] = useState(false);
  
  // Companies data
  const [sectorCompanies, setSectorCompanies] = useState([]);
  const [industryCompanies, setIndustryCompanies] = useState([]);
  
  // Loading states
  const [sectorCompaniesLoading, setSectorCompaniesLoading] = useState(false);
  const [industryCompaniesLoading, setIndustryCompaniesLoading] = useState(false);
  
  // Full screen states
  const [isIndustriesFullScreen, setIsIndustriesFullScreen] = useState(false);
  const [isCompaniesFullScreen, setIsCompaniesFullScreen] = useState(false);

  const toggleSectorCompanies = useCallback(() => {
    setShowSectorCompanies(prev => !prev);
  }, []);

  const toggleIndustryCompanies = useCallback(() => {
    setShowIndustryCompanies(prev => !prev);
  }, []);

  const resetCompaniesState = useCallback(() => {
    setShowSectorCompanies(false);
    setShowIndustryCompanies(false);
    setSectorCompanies([]);
    setIndustryCompanies([]);
    setSectorCompaniesLoading(false);
    setIndustryCompaniesLoading(false);
    setIsIndustriesFullScreen(false);
    setIsCompaniesFullScreen(false);
  }, []);

  return {
    // Display state
    showSectorCompanies,
    setShowSectorCompanies,
    showIndustryCompanies,
    setShowIndustryCompanies,
    
    // Companies data
    sectorCompanies,
    setSectorCompanies,
    industryCompanies,
    setIndustryCompanies,
    
    // Loading states
    sectorCompaniesLoading,
    setSectorCompaniesLoading,
    industryCompaniesLoading,
    setIndustryCompaniesLoading,
    
    // Full screen states
    isIndustriesFullScreen,
    setIsIndustriesFullScreen,
    isCompaniesFullScreen,
    setIsCompaniesFullScreen,
    
    // Actions
    toggleSectorCompanies,
    toggleIndustryCompanies,
    resetCompaniesState
  };
};

export default useCompaniesDisplay;