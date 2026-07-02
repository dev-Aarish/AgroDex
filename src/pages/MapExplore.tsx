import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { getBatches } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { SupplyChainMap, MapBatch } from '@/components/SupplyChainMap';
import { Loader2 } from 'lucide-react';

export default function MapExplore() {
  const { data: batches, isLoading, error } = useQuery({
    queryKey: ['explore-batches'],
    queryFn: getBatches,
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Helmet>
        <title>Supply Chain Map | AgroDex</title>
      </Helmet>
      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Supply Chain Map
          </h1>
          <p className="text-muted-foreground mt-2">
            Explore registered agricultural batches across Indonesia. Click on any pin to view provenance, fraud risk, and Hedera verification status.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-[600px] border rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
            <span className="ml-3 text-lg text-gray-500">Loading supply chain data...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[600px] border border-red-200 rounded-xl bg-red-50 text-red-600">
            Failed to load map data. Please try again later.
          </div>
        ) : (
          <SupplyChainMap batches={batches as MapBatch[] || []} />
        )}
      </main>

      <Footer />
    </div>
  );
}
