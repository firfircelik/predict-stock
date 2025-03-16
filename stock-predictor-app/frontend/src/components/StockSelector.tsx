import { useEffect, useState } from 'react';
import { 
  Box, 
  Button, 
  Select, 
  FormControl, 
  FormLabel, 
  Heading, 
  Text,
  VStack,
  Flex,
  useToast
} from '@chakra-ui/react';
import { getStocks } from '@/lib/api';
import { MODEL_OPTIONS } from '@/lib/constants';
import { ModelType } from '@/types';

interface StockSelectorProps {
  onSubmit: (symbols: string[], modelType: ModelType) => void;
  isLoading: boolean;
}

export default function StockSelector({ onSubmit, isLoading }: StockSelectorProps) {
  const [availableStocks, setAvailableStocks] = useState<Record<string, string>>({});
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelType>('random_forest');
  const [isLoadingStocks, setIsLoadingStocks] = useState(true);
  const [error, setError] = useState('');
  
  const toast = useToast();

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setIsLoadingStocks(true);
        const stocks = await getStocks();
        setAvailableStocks(stocks);
        setError('');
      } catch (error) {
        console.error('Error fetching stocks:', error);
        setError('Hisse listesi yüklenemedi. Lütfen daha sonra tekrar deneyin.');
        toast({
          title: 'Hata',
          description: 'Hisse listesi yüklenemedi',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoadingStocks(false);
      }
    };

    fetchStocks();
  }, [toast]);

  const handleStockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selected: string[] = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    
    setSelectedSymbols(selected);
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(e.target.value as ModelType);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedSymbols.length === 0) {
      toast({
        title: 'Hisse seçilmedi',
        description: 'Lütfen en az bir hisse senedi seçin',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    onSubmit(selectedSymbols, selectedModel);
  };

  const getModelDescription = () => {
    const model = MODEL_OPTIONS.find(m => m.value === selectedModel);
    return model?.description || '';
  };

  return (
    <Box 
      as="form" 
      onSubmit={handleSubmit} 
      p={6} 
      borderWidth="1px" 
      borderRadius="lg" 
      boxShadow="md"
      bg="white"
    >
      <VStack spacing={6} align="stretch">
        <Heading size="md">Hisse Tahmin Parametreleri</Heading>
        
        {error && (
          <Text color="red.500">{error}</Text>
        )}
        
        <FormControl isRequired isDisabled={isLoadingStocks}>
          <FormLabel>Hisse Senetleri</FormLabel>
          <Select
            multiple
            height="200px"
            value={selectedSymbols}
            onChange={handleStockChange}
            placeholder={isLoadingStocks ? 'Hisseler yükleniyor...' : 'Hisseleri seçin'}
          >
            {Object.entries(availableStocks).map(([symbol, name]) => (
              <option key={symbol} value={symbol}>
                {symbol} - {name}
              </option>
            ))}
          </Select>
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Tahmin Modeli</FormLabel>
          <Select 
            value={selectedModel} 
            onChange={handleModelChange}
          >
            {MODEL_OPTIONS.map(model => (
              <option key={model.value} value={model.value}>
                {model.label}
              </option>
            ))}
          </Select>
          <Text fontSize="sm" color="gray.600" mt={1}>
            {getModelDescription()}
          </Text>
        </FormControl>
        
        <Flex justify="flex-end">
          <Button 
            type="submit" 
            colorScheme="blue" 
            isLoading={isLoading} 
            loadingText="Tahmin Ediliyor..."
            isDisabled={isLoadingStocks || selectedSymbols.length === 0}
          >
            Tahmin Et
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
} 