import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

// Fix for default marker icon in react-leaflet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// A simple dictionary to map common string locations to approx coordinates (Lat, Lng)
const REGION_COORDINATES: Record<string, [number, number]> = {
  'Lampung': [-4.5586, 105.4068],
  'Sumatra': [-0.5897, 101.3431],
  'Java': [-7.6145, 110.7122],
  'Bali': [-8.4095, 115.1889],
  'Kalimantan': [1.4326, 114.1511],
  'Sulawesi': [-1.4300, 121.4456],
  'Papua': [-4.2699, 138.0803],
  'Jakarta': [-6.2088, 106.8456],
  'Bandung': [-6.9175, 107.6191],
  'Surabaya': [-7.2504, 112.7688],
  'Default': [-0.7893, 113.9213] // Center of Indonesia
};

export interface MapBatch {
  id: string;
  batch_name: string;
  location: string;
  quantity: number;
  harvest_date: string;
  status: string;
  farmer_id: string;
  hcs_tx_id?: string;
  ai_analysis?: {
    riskLevel?: string;
  };
}

interface SupplyChainMapProps {
  batches: MapBatch[];
}

function getCoordinates(locationStr: string): [number, number] {
  if (!locationStr) return REGION_COORDINATES['Default'];
  
  const loc = locationStr.toLowerCase();
  for (const [region, coords] of Object.entries(REGION_COORDINATES)) {
    if (loc.includes(region.toLowerCase())) {
      // Add a tiny random jitter so markers in the same region don't completely overlap
      const jitterLat = (Math.random() - 0.5) * 0.5;
      const jitterLng = (Math.random() - 0.5) * 0.5;
      return [coords[0] + jitterLat, coords[1] + jitterLng];
    }
  }
  
  // If not found, place in center of Indonesia with wider jitter
  const jitterLat = (Math.random() - 0.5) * 5;
  const jitterLng = (Math.random() - 0.5) * 10;
  return [REGION_COORDINATES['Default'][0] + jitterLat, REGION_COORDINATES['Default'][1] + jitterLng];
}

export function SupplyChainMap({ batches }: SupplyChainMapProps) {
  // Center of Indonesia
  const centerPosition: [number, number] = [-0.7893, 113.9213];

  return (
    <Card className="w-full h-[600px] overflow-hidden rounded-xl border border-border shadow-sm">
      <MapContainer 
        center={centerPosition} 
        zoom={5} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {batches.map((batch) => {
          const position = getCoordinates(batch.location);
          const riskLevel = batch.ai_analysis?.riskLevel || 'Unknown';
          
          let riskColor = 'bg-gray-500';
          if (riskLevel.toLowerCase() === 'low') riskColor = 'bg-emerald-500';
          if (riskLevel.toLowerCase() === 'medium') riskColor = 'bg-yellow-500';
          if (riskLevel.toLowerCase() === 'high') riskColor = 'bg-red-500';

          return (
            <Marker key={batch.id} position={position}>
              <Popup className="custom-popup">
                <div className="flex flex-col space-y-2 p-1 min-w-[200px]">
                  <h3 className="font-bold text-lg leading-tight">{batch.batch_name}</h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={riskColor + " text-white border-none"}>
                      {riskLevel} Risk
                    </Badge>
                    <Badge variant="secondary">{batch.status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    <p><strong>Location:</strong> {batch.location || 'Unknown'}</p>
                    <p><strong>Quantity:</strong> {batch.quantity} kg</p>
                    <p><strong>Harvest:</strong> {batch.harvest_date ? format(new Date(batch.harvest_date), 'MMM d, yyyy') : 'N/A'}</p>
                    <p><strong>Farmer ID:</strong> {batch.farmer_id.substring(0, 8)}...</p>
                  </div>
                  {batch.hcs_tx_id && (
                    <a 
                      href={`https://hashscan.io/testnet/transaction/${batch.hcs_tx_id}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs text-blue-500 hover:underline mt-2 inline-block"
                    >
                      View on HashScan
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </Card>
  );
}
