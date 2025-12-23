import React, { useMemo, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

const Financial: React.FC = () => {
  const { user, getSelectedFarm } = useAuth();
  const selectedFarm = getSelectedFarm() || (user?.farms?.[0] ?? null);
  const { getSelectedFarmZoneLocks } = useAuth();
  const zoneLocks = getSelectedFarmZoneLocks();
  const [gemini, setGemini] = useState<any | null>(null);

  const lockedSummary = useMemo(() => {
    const totalArea = zoneLocks.reduce((sum, z) => sum + (z.area || 0), 0);
    const totalCost = zoneLocks.reduce((sum, z) => sum + (z.area * z.estimatedCostPerAcre), 0);
    const totalRevenue = zoneLocks.reduce((sum, z) => sum + (z.area * z.expectedRevenuePerAcre), 0);
    const netProfit = totalRevenue - totalCost;
    const roi = totalCost > 0 ? Math.round((netProfit / totalCost) * 1000) / 10 : 0;
    const byCrop = zoneLocks.reduce<Record<string, { area: number; cost: number; revenue: number }>>((acc, z) => {
      const key = z.crop;
      const current = acc[key] || { area: 0, cost: 0, revenue: 0 };
      current.area += z.area;
      current.cost += z.area * z.estimatedCostPerAcre;
      current.revenue += z.area * z.expectedRevenuePerAcre;
      acc[key] = current;
      return acc;
    }, {});
    return { totalArea, totalCost, totalRevenue, netProfit, roi, byCrop };
  }, [zoneLocks]);

  const displayRoi = zoneLocks.length > 0 ? `${lockedSummary.roi}%` : '—';

  useEffect(() => {
    const fetchGemini = async () => {
      try {
        let lat: number | null = null;
        let lon: number | null = null;
        if (selectedFarm?.coordinates) {
          const cleaned = selectedFarm.coordinates.replace(/[^\d\.,\- ]/g, '');
          const parts = cleaned.split(',').map(s => s.trim());
          if (parts.length >= 2) {
            const plat = Number(parts[0]);
            const plon = Number(parts[1]);
            if (!Number.isNaN(plat) && !Number.isNaN(plon)) {
              lat = plat;
              lon = plon;
            }
          }
        }
        const res = await api.post('/api/weather/gemini-insights', {
          lat: lat ?? 30.7333,
          lon: lon ?? 76.7794,
          days: 7,
        });
        setGemini(res.data || null);
      } catch {
        setGemini(null);
      }
    };
    fetchGemini();
  }, [selectedFarm?.id]);

  return (
    <section className="section" style={{ paddingTop: 'var(--space-xl)' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="pill" style={{ marginBottom: 'var(--space-sm)' }}>💰 Financial Intelligence</div>
          <h1 style={{ fontSize: 'var(--h1)', marginBottom: 'var(--space-md)', color: 'var(--text-primary)' }}>
            Farmer-First Financial Command Center
          </h1>
          <p style={{ fontSize: 'var(--body-lg)', color: 'var(--text-secondary)', maxWidth: 'var(--narrow-width)', lineHeight: 1.6 }}>
            Unique to Agrinex: price intelligence + subsidy optimizer + cashflow stress-tests. Get lender-grade views, risk buffers, and smart actions farmers actually need.
          </p>
        </div>

        {gemini && (
          <div className="card-apple" style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 'var(--h3)', fontWeight: 700, color: 'var(--text-primary)' }}>
                AI Insights
              </div>
              <div className="pill" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'var(--green-primary)', color: 'var(--green-light)', fontSize: '11px' }}>
                Gemini
              </div>
            </div>
            <div style={{ marginTop: 'var(--space-sm)', fontSize: 'var(--body)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {gemini?.summary?.text || ''}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
              <div style={{ padding: 'var(--space-md)', border: '1px solid var(--border-color)', borderRadius: 'var(--space-xs)', background: 'var(--bg-tertiary)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Irrigation</div>
                <div style={{ fontSize: 'var(--body)', fontWeight: 600, color: 'var(--text-primary)' }}>{gemini?.irrigation?.action}</div>
              </div>
              <div style={{ padding: 'var(--space-md)', border: '1px solid var(--border-color)', borderRadius: 'var(--space-xs)', background: 'var(--bg-tertiary)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Next 7 Days Rain</div>
                <div style={{ fontSize: 'var(--body)', fontWeight: 600, color: 'var(--text-primary)' }}>{gemini?.rainfall?.next7days}%</div>
              </div>
              <div style={{ padding: 'var(--space-md)', border: '1px solid var(--border-color)', borderRadius: 'var(--space-xs)', background: 'var(--bg-tertiary)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Soil Risk</div>
                <div style={{ fontSize: 'var(--body)', fontWeight: 600, color: 'var(--text-primary)' }}>{gemini?.soilRisk?.risk}</div>
              </div>
            </div>
          </div>
        )}

        {/* Farm context */}
        {selectedFarm && (
          <div className="card-apple" style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
              <div>
                <div style={{ fontSize: 'var(--body)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-xs)' }}>
                  Farm
                </div>
                <div style={{ fontSize: 'var(--h2)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedFarm.name}
                </div>
                <div style={{ fontSize: 'var(--body)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {selectedFarm.location} · {selectedFarm.area || 0} acres
                </div>
              </div>
              <div style={{
                padding: 'var(--space-sm) var(--space-md)',
                borderRadius: 'var(--space-xs)',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid var(--green-primary)',
                color: 'var(--green-light)',
                fontSize: 'var(--body)',
                fontWeight: 600,
              }}>
                ROI: {displayRoi}
              </div>
            </div>
          </div>
        )}

        {zoneLocks.length > 0 && (
          <div className="card-apple" style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: 'var(--h2)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
              Locked Zones Financials
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
              <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--space-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Region</div>
                <div style={{ fontSize: 'var(--h3)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedFarm?.location || '—'}
                </div>
              </div>
              <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--space-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Total Area Locked</div>
                <div style={{ fontSize: 'var(--h3)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {lockedSummary.totalArea} acres
                </div>
              </div>
              <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--space-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Total Cost</div>
                <div style={{ fontSize: 'var(--h3)', fontWeight: 700, color: '#f59e0b' }}>
                  ₹{lockedSummary.totalCost.toLocaleString()}
                </div>
              </div>
              <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--space-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Total Expected Revenue</div>
                <div style={{ fontSize: 'var(--h3)', fontWeight: 700, color: 'var(--green-light)' }}>
                  ₹{lockedSummary.totalRevenue.toLocaleString()}
                </div>
              </div>
              <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--space-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Net Profit</div>
                <div style={{ fontSize: 'var(--h3)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  ₹{lockedSummary.netProfit.toLocaleString()}
                </div>
              </div>
              <div style={{ padding: 'var(--space-md)', borderRadius: 'var(--space-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>ROI</div>
                <div style={{ fontSize: 'var(--h3)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {lockedSummary.roi}%
                </div>
              </div>
          </div>
          <div style={{ marginTop: 'var(--space-lg)' }}>
            <div style={{ fontSize: 'var(--body)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
              Crop Cost Breakdown
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: 'var(--space-sm)' }}>
              {zoneLocks.map((z, i) => (
                <div key={i} className="pill" style={{ fontSize: '11px' }}>
                  {z.crop}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-sm)' }}>
              {Object.entries(lockedSummary.byCrop).map(([crop, v], i) => (
                <div key={i} style={{ padding: 'var(--space-sm)', borderRadius: 'var(--space-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                  <div style={{ fontSize: 'var(--body)', fontWeight: 700, color: 'var(--text-primary)' }}>{crop}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Area: {v.area} acres</div>
                    <div style={{ fontSize: '12px', color: '#f59e0b' }}>Cost: ₹{v.cost.toLocaleString()}</div>
                    <div style={{ fontSize: '12px', color: 'var(--green-light)' }}>Revenue: ₹{v.revenue.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 'var(--space-lg)' }}>
              <div style={{ fontSize: 'var(--body)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>
                Per-Zone Details
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-sm)' }}>
                {zoneLocks.map((z, i) => {
                  const zoneCost = z.area * z.estimatedCostPerAcre;
                  const zoneRevenue = z.area * z.expectedRevenuePerAcre;
                  const zoneProfit = zoneRevenue - zoneCost;
                  const zoneRoi = zoneCost > 0 ? Math.round((zoneProfit / zoneCost) * 1000) / 10 : 0;
                  return (
                    <div key={i} style={{ padding: 'var(--space-md)', borderRadius: 'var(--space-xs)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                        <div style={{ fontSize: 'var(--body)', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {z.id}
                        </div>
                        <div className="pill" style={{ fontSize: '11px' }}>
                          {z.crop}
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>Area: {z.area} acres</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-sm)' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Cost</div>
                          <div style={{ fontSize: 'var(--body)', color: '#f59e0b', fontWeight: 700 }}>₹{zoneCost.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Revenue</div>
                          <div style={{ fontSize: 'var(--body)', color: 'var(--green-light)', fontWeight: 700 }}>₹{zoneRevenue.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Profit</div>
                          <div style={{ fontSize: 'var(--body)', color: 'var(--text-primary)', fontWeight: 700 }}>₹{zoneProfit.toLocaleString()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>ROI</div>
                          <div style={{ fontSize: 'var(--body)', color: 'var(--text-primary)', fontWeight: 700 }}>{zoneRoi}%</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {zoneLocks.length === 0 && (
          <div className="card-apple" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 'var(--body)', color: 'var(--text-secondary)' }}>
                No locked zones. Lock zones in the Network page to view financials.
              </div>
              <a className="btn btn-secondary" href="/network">Go to Network</a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Financial;

