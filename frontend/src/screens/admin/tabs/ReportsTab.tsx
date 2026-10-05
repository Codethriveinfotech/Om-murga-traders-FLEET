import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useDashboardData } from '../../../context/DashboardDataContext';
import { styles, fontStyle } from '../AdminStyles';
import { Ionicons } from '@expo/vector-icons';

export default function ReportsTab() {
  const { trips, drivers, vehicles, maintenance, fuelLogs } = useDashboardData();
  const [selectedReportType, setSelectedReportType] = useState('Trip Summary Report');
  const [duration, setDuration] = useState('month'); // 'today', 'yesterday', 'week', 'month', '3months', '6months', '1year', 'custom'
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  // Robust date parser (supports DD/MM/YYYY, YYYY-MM-DD, ISO strings)
  const parseDate = (str: string): Date | null => {
    if (!str) return null;
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    }
    if (str.includes('-')) {
      const parts = str.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  };

  // Calculate start and end boundary dates based on selected duration preset
  const getDateRange = (): { start: Date; end: Date } => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (duration === 'today') {
      return { start: todayStart, end: todayEnd };
    }
    if (duration === 'yesterday') {
      const yestStart = new Date(todayStart);
      yestStart.setDate(yestStart.getDate() - 1);
      const yestEnd = new Date(todayEnd);
      yestEnd.setDate(yestEnd.getDate() - 1);
      return { start: yestStart, end: yestEnd };
    }
    if (duration === 'week') {
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
      return { start: weekStart, end: todayEnd };
    }
    if (duration === 'month') {
      const monthStart = new Date(todayStart);
      monthStart.setMonth(monthStart.getMonth() - 1);
      return { start: monthStart, end: todayEnd };
    }
    if (duration === '3months') {
      const m3Start = new Date(todayStart);
      m3Start.setMonth(m3Start.getMonth() - 3);
      return { start: m3Start, end: todayEnd };
    }
    if (duration === '6months') {
      const m6Start = new Date(todayStart);
      m6Start.setMonth(m6Start.getMonth() - 6);
      return { start: m6Start, end: todayEnd };
    }
    if (duration === '1year') {
      const yrStart = new Date(todayStart);
      yrStart.setFullYear(yrStart.getFullYear() - 1);
      return { start: yrStart, end: todayEnd };
    }
    if (duration === 'custom') {
      const start = customFromDate ? new Date(customFromDate + 'T00:00:00') : new Date(0);
      const end = customToDate ? new Date(customToDate + 'T23:59:59') : new Date();
      return { start, end };
    }
    return { start: new Date(0), end: todayEnd };
  };

  // Filter based on chosen duration & date range
  const getFilteredData = () => {
    const { start, end } = getDateRange();

    const isWithinRange = (dateStr: string) => {
      if (!dateStr) return false;
      const d = parseDate(dateStr);
      return d ? d >= start && d <= end : false;
    };

    const filteredTrips = trips.filter(t => {
      const dateOk = isWithinRange(t.startDate);
      if (!dateOk) return false;
      if (selectedVehicleId && t.vehicleId !== selectedVehicleId) return false;
      if (selectedDriverId && t.driverId !== selectedDriverId) return false;
      return true;
    });

    const filteredMaint = maintenance.filter(m => {
      const dateOk = isWithinRange(m.date);
      if (!dateOk) return false;
      if (selectedVehicleId && m.vehicleId !== selectedVehicleId) return false;
      if (selectedDriverId && m.driverId !== selectedDriverId) return false;
      return true;
    });

    const filteredFuel = fuelLogs.filter(f => {
      const dateOk = isWithinRange(f.date);
      if (!dateOk) return false;
      if (selectedVehicleId && f.vehicleId !== selectedVehicleId) return false;
      if (selectedDriverId && f.driverId !== selectedDriverId) return false;
      return true;
    });

    return { filteredTrips, filteredMaint, filteredFuel };
  };

  const { filteredTrips, filteredMaint, filteredFuel } = getFilteredData();

  // Excel (CSV) Export Utility
  const handleDownloadExcel = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let rangeLabel = duration;
    if (duration === 'custom') {
      rangeLabel = `${customFromDate || 'Start'}_to_${customToDate || 'End'}`;
    }
    let filename = `${selectedReportType.replace(/\s+/g, '_')}_${rangeLabel}_Report.csv`;

    if (selectedReportType === 'Trip Summary Report') {
      headers = [
        'S.No', 'Date', 'Time', 'Operator Driver', 'Vehicle No', 'Source', 'Destination', 
        'Start Odometer (KM)', 'End Odometer (KM)', 'Distance Run (KM)', 
        'Start HMR (HRS)', 'End HMR (HRS)', 'HMR Worked (HRS)', 'Fuel Level', 'Fuel Filling HMR', 'Status', 'Breakdown'
      ];
      rows = filteredTrips.map((t, idx) => {
        const d = drivers.find(drv => drv.id === t.driverId)?.name || 'Unknown';
        const v = vehicles.find(veh => veh.id === t.vehicleId)?.number || 'Unknown';
        const start = parseFloat(t.startOdometer) || 0;
        const end = parseFloat(t.endOdometer) || 0;
        const dist = end >= start ? (end - start) : 0;
        const startH = parseFloat(t.startHmr) || 0;
        const endH = parseFloat(t.endHmr) || 0;
        const hmr = endH >= startH ? (endH - startH) : 0;
        const tripFuel = fuelLogs.filter(f => f.vehicleId === t.vehicleId && (f.date === t.startDate || f.date === t.endDate));
        const fuelCost = tripFuel.reduce((acc, f) => acc + (parseFloat(f.cost) || 0), 0);
        return [
          (idx + 1).toString(),
          t.startDate ? `="\t${t.startDate}"` : '',
          t.startTime || '',
          d,
          v,
          t.sourceLocation || '',
          t.destinationLocation || '',
          t.startOdometer || '0',
          t.endOdometer || '0',
          t.endOdometer ? dist.toString() : '0',
          t.startHmr || '0',
          t.endHmr || (t.status === 'started' ? '-' : '0'),
          t.endHmr ? hmr.toFixed(1) : '-',
          t.fuelLevel || t.fuel_level || '',
          t.notes || '',
          t.status || '',
          t.isBreakdown ? 'YES' : 'NO'
        ];
      });

      // Calculate and Add Totals
      const totalDistance = filteredTrips.reduce((acc, t) => {
        const start = parseFloat(t.startOdometer) || 0;
        const end = parseFloat(t.endOdometer) || 0;
        return acc + (end >= start ? (end - start) : 0);
      }, 0);
      const totalHmrWorked = filteredTrips.reduce((acc, t) => {
        const start = parseFloat(t.startHmr) || 0;
        const end = parseFloat(t.endHmr) || 0;
        return acc + (end >= start ? (end - start) : 0);
      }, 0);
      rows.push([
        'TOTAL', '', '', '', '', '', '', 
        '', '', totalDistance.toString(), 
        '', '', totalHmrWorked.toFixed(1), '', '', '', ''
      ]);

    } else if (selectedReportType === 'Fuel Report') {
      headers = ['S.No', 'Date', 'Time', 'Vehicle No', 'Driver Name', 'Liters Refilled', 'Total Cost (₹)', 'Odometer Reading'];
      rows = filteredFuel.map((f, idx) => {
        const v = vehicles.find(veh => veh.id === f.vehicleId)?.number || 'Unknown';
        const d = drivers.find(drv => drv.id === f.driverId)?.name || 'Unknown';
        return [
          (idx + 1).toString(),
          f.date ? `="\t${f.date}"` : '',
          f.time || '',
          v,
          d,
          f.liters || '0',
          f.cost || '0',
          f.odometerReading || '0'
        ];
      });

      // Calculate and Add Totals
      const totalLiters = filteredFuel.reduce((acc, f) => acc + (parseFloat(f.liters) || 0), 0);
      const totalCost = filteredFuel.reduce((acc, f) => acc + (parseFloat(f.cost) || 0), 0);
      rows.push([
        'TOTAL', '', '', '', '', totalLiters.toFixed(1), totalCost.toFixed(2), ''
      ]);

    } else if (selectedReportType === 'Driver Performance Report') {
      if (selectedDriverId) {
        const driverName = drivers.find(d => d.id === selectedDriverId)?.name || 'Driver';
        filename = `Detailed_Report_Driver_${driverName.replace(/\s+/g, '_')}_${duration}m.csv`;
        headers = ['S.No', 'Date', 'Vehicle No', 'Source', 'Destination', 'Distance (km)', 'Shift', 'HMR Worked', 'Breakdown'];
        
        const dTrips = filteredTrips.filter(t => t.driverId === selectedDriverId);
        rows = dTrips.map((t, idx) => {
          const v = vehicles.find(veh => veh.id === t.vehicleId)?.number || 'Unknown';
          const start = parseFloat(t.startOdometer) || 0;
          const end = parseFloat(t.endOdometer) || 0;
          const dist = end >= start ? (end - start) : 0;
          const endH = parseFloat(t.endHmr) || 0;
          const startH = parseFloat(t.startHmr) || 0;
          const hmr = endH >= startH ? (endH - startH) : 0;
          return [
            (idx + 1).toString(),
            t.startDate ? `="\t${t.startDate}"` : '',
            v,
            t.sourceLocation || '',
            t.destinationLocation || '',
            dist.toString(),
            t.shift || '',
            hmr.toFixed(1),
            t.isBreakdown ? 'YES' : 'NO'
          ];
        });

        // Calculate and Add Totals
        const totalDistance = dTrips.reduce((acc, t) => {
          const start = parseFloat(t.startOdometer) || 0;
          const end = parseFloat(t.endOdometer) || 0;
          return acc + (end >= start ? (end - start) : 0);
        }, 0);
        const totalHmrWorked = dTrips.reduce((acc, t) => {
          const start = parseFloat(t.startHmr) || 0;
          const end = parseFloat(t.endHmr) || 0;
          return acc + (end >= start ? (end - start) : 0);
        }, 0);
        rows.push([
          'TOTAL', '', '', '', '', totalDistance.toString(), '', totalHmrWorked.toFixed(1), ''
        ]);

      } else {
        headers = ['S.No', 'Driver Name', 'Total Trips', 'Day Shifts', 'Night Shifts', 'Breakdowns Count', 'Billing Days'];
        rows = drivers.map((driver, idx) => {
          const dTrips = filteredTrips.filter(t => t.driverId === driver.id);
          const dayShifts = dTrips.filter(t => (t.shift || '').toLowerCase().includes('day')).length;
          const nightShifts = dTrips.filter(t => (t.shift || '').toLowerCase().includes('night')).length;
          const breakdowns = dTrips.filter(t => t.isBreakdown).length;
          const billingDays = Math.max(0, dTrips.length - breakdowns);
          return [
            (idx + 1).toString(),
            driver.name || 'Unknown',
            dTrips.length.toString(),
            dayShifts.toString(),
            nightShifts.toString(),
            breakdowns.toString(),
            billingDays.toString()
          ];
        });

        // Calculate and Add Totals
        let sumTrips = 0, sumDay = 0, sumNight = 0, sumBreak = 0, sumBill = 0;
        drivers.forEach(driver => {
          const dTrips = filteredTrips.filter(t => t.driverId === driver.id);
          const dayShifts = dTrips.filter(t => (t.shift || '').toLowerCase().includes('day')).length;
          const nightShifts = dTrips.filter(t => (t.shift || '').toLowerCase().includes('night')).length;
          const breakdowns = dTrips.filter(t => t.isBreakdown).length;
          const billingDays = Math.max(0, dTrips.length - breakdowns);
          sumTrips += dTrips.length;
          sumDay += dayShifts;
          sumNight += nightShifts;
          sumBreak += breakdowns;
          sumBill += billingDays;
        });
        rows.push([
          'TOTAL', '', sumTrips.toString(), sumDay.toString(), sumNight.toString(), sumBreak.toString(), sumBill.toString()
        ]);
      }
    } else if (selectedReportType === 'Vehicle Utilization Report') {
      if (selectedVehicleId) {
        const vehNo = vehicles.find(v => v.id === selectedVehicleId)?.number || 'Vehicle';
        filename = `Detailed_Report_Vehicle_${vehNo.replace(/\s+/g, '_')}_${duration}m.csv`;
        headers = ['S.No', 'Date', 'Driver Name', 'Source', 'Destination', 'Distance (km)', 'Fuel Used (L)', 'Refill Cost (₹)', 'Maintenance Cost (₹)'];
        
        const vTrips = filteredTrips.filter(t => t.vehicleId === selectedVehicleId);
        rows = vTrips.map((t, idx) => {
          const dName = drivers.find(d => d.id === t.driverId)?.name || 'Unknown';
          const start = parseFloat(t.startOdometer) || 0;
          const end = parseFloat(t.endOdometer) || 0;
          const dist = end >= start ? (end - start) : 0;
          
          const dateRefills = filteredFuel.filter(f => f.vehicleId === selectedVehicleId && f.date === t.startDate);
          const totalFuel = dateRefills.reduce((acc, f) => acc + (parseFloat(f.liters) || 0), 0);
          const totalFuelCost = dateRefills.reduce((acc, f) => acc + (parseFloat(f.cost) || 0), 0);
          
          const dateMaint = filteredMaint.filter(m => m.vehicleId === selectedVehicleId && m.date === t.startDate);
          const totalMaintCost = dateMaint.reduce((acc, m) => acc + (parseFloat(m.cost) || 0), 0);

          return [
            (idx + 1).toString(),
            t.startDate ? `="\t${t.startDate}"` : '',
            dName,
            t.sourceLocation || '',
            t.destinationLocation || '',
            dist.toString(),
            totalFuel.toString(),
            totalFuelCost.toString(),
            totalMaintCost.toString()
          ];
        });

        // Calculate and Add Totals
        const totalDistance = vTrips.reduce((acc, t) => {
          const start = parseFloat(t.startOdometer) || 0;
          const end = parseFloat(t.endOdometer) || 0;
          return acc + (end >= start ? (end - start) : 0);
        }, 0);
        
        let totalFuel = 0, totalFuelCost = 0, totalMaintCost = 0;
        vTrips.forEach(t => {
          const dateRefills = filteredFuel.filter(f => f.vehicleId === selectedVehicleId && f.date === t.startDate);
          totalFuel += dateRefills.reduce((acc, f) => acc + (parseFloat(f.liters) || 0), 0);
          totalFuelCost += dateRefills.reduce((acc, f) => acc + (parseFloat(f.cost) || 0), 0);
          
          const dateMaint = filteredMaint.filter(m => m.vehicleId === selectedVehicleId && m.date === t.startDate);
          totalMaintCost += dateMaint.reduce((acc, m) => acc + (parseFloat(m.cost) || 0), 0);
        });
        rows.push([
          'TOTAL', '', '', '', '', totalDistance.toString(), totalFuel.toString(), totalFuelCost.toFixed(2), totalMaintCost.toFixed(2)
        ]);

      } else {
        headers = ['S.No', 'Vehicle No', 'Model', 'Total Trips Run', 'Total Distance Run (km)'];
        rows = vehicles.map((veh, idx) => {
          const vTrips = filteredTrips.filter(t => t.vehicleId === veh.id);
          const totalDist = vTrips.reduce((acc, t) => {
            const start = parseFloat(t.startOdometer) || 0;
            const end = parseFloat(t.endOdometer) || 0;
            return acc + (end >= start ? end - start : 0);
          }, 0);
          return [
            (idx + 1).toString(),
            veh.number || 'Unknown',
            veh.model || 'Unknown',
            vTrips.length.toString(),
            totalDist.toString()
          ];
        });

        // Calculate and Add Totals
        let sumTrips = 0, sumDist = 0;
        vehicles.forEach(veh => {
          const vTrips = filteredTrips.filter(t => t.vehicleId === veh.id);
          const totalDist = vTrips.reduce((acc, t) => {
            const start = parseFloat(t.startOdometer) || 0;
            const end = parseFloat(t.endOdometer) || 0;
            return acc + (end >= start ? end - start : 0);
          }, 0);
          sumTrips += vTrips.length;
          sumDist += totalDist;
        });
        rows.push([
          'TOTAL', '', '', sumTrips.toString(), sumDist.toString()
        ]);
      }
    } else if (selectedReportType === 'Maintenance Report') {
      headers = ['S.No', 'Date', 'Vehicle No', 'Driver Name', 'Type', 'Description', 'Notes', 'Cost (₹)'];
      rows = filteredMaint.map((m, idx) => {
        const v = vehicles.find(veh => veh.id === m.vehicleId)?.number || 'Unknown';
        const d = drivers.find(drv => drv.id === m.driverId)?.name || 'Unknown';
        return [
          (idx + 1).toString(),
          m.date ? `="\t${m.date}"` : '',
          v,
          d,
          m.maintenanceType || '',
          m.description || '',
          m.serviceNotes || '',
          m.cost || '0'
        ];
      });

      // Calculate and Add Totals
      const totalCost = filteredMaint.reduce((acc, m) => acc + (parseFloat(m.cost) || 0), 0);
      rows.push([
        'TOTAL', '', '', '', '', '', '', totalCost.toFixed(2)
      ]);
    } else if (selectedReportType === 'Breakdown Report') {
      headers = ['S.No', 'Vehicle No', 'Breakdown Date', 'Breakdown Time', 'Active Time', 'Issue / Remarks'];
      const breakdowns = filteredMaint.filter(m => m.isBreakdownReport || m.maintenanceType === 'Breakdown Report' || m.maintenanceType === 'Breakdown' || m.maintenanceType === 'Breakdown Resolution');
      rows = breakdowns.map((m, idx) => {
        const v = vehicles.find(veh => veh.id === m.vehicleId)?.number || 'Unknown';
        
        let bdTime = m.time || '';
        let actTime = '';
        if (m.description?.includes('Breakdown Time:')) {
          const matchBD = m.description.match(/Breakdown Time: (.*?) \|/);
          if (matchBD) bdTime = matchBD[1];
          const matchAct = m.description.match(/Active Time: (.*)/);
          if (matchAct) actTime = matchAct[1];
        }

        return [
          (idx + 1).toString(),
          v,
          m.date ? `="\t${m.date}"` : '',
          bdTime,
          actTime,
          m.serviceNotes || m.description || ''
        ];
      });
      rows.push(['TOTAL BREAKDOWNS', '', '', '', '', breakdowns.length.toString()]);
    }

    // Convert array to CSV format with UTF-8 BOM for perfect Excel compatibility
    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...rows.map(e => e.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Trigger download in browser environment
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 20 }}>
      {/* Left Pane: Report Types */}
      <View style={[styles.rightVehiclesPanel, { width: 280, maxWidth: '100%' }]}>
        <Text style={[styles.panelTitle, { marginBottom: 16, fontFamily: fontStyle, fontSize: 17 }]}>Report Types</Text>
        {[
          { key: 'Trip Summary Report', label: 'Trip Summary Report', desc: 'Summary of all trips', icon: '📋' },
          { key: 'Fuel Report', label: 'Fuel Report', desc: 'Fuel consumption and refills', icon: '⛽' },
          { key: 'Driver Performance Report', label: 'Driver Performance Report', desc: 'Driver shift and billing analytics', icon: '👤' },
          { key: 'Vehicle Utilization Report', label: 'Vehicle Utilization Report', desc: 'Vehicle distance and usage stats', icon: '🚚' },
          { key: 'Maintenance Report', label: 'Maintenance Report', desc: 'Maintenance records and costs', icon: '🔧' },
          { key: 'Breakdown Report', label: 'Breakdown Report', desc: 'Detailed breakdown history', icon: '🚨' },
        ].map((opt) => {
          const isSel = selectedReportType === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.menuItem,
                { paddingVertical: 14, paddingHorizontal: 14, backgroundColor: isSel ? '#EFF6FF' : 'transparent', borderWidth: 1, borderColor: isSel ? '#1D4ED8' : 'transparent', borderRadius: 8, marginBottom: 8 }
              ]}
              onPress={() => {
                setSelectedReportType(opt.key);
                setSelectedDriverId('');
                setSelectedVehicleId('');
              }}
            >
              <Text style={{ fontSize: 16, marginRight: 10 }}>{opt.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: isSel ? '#1D4ED8' : '#1E293B', fontFamily: fontStyle }}>{opt.label}</Text>
                <Text style={{ fontSize: 10, color: '#94A3B8', fontFamily: fontStyle, marginTop: 2 }}>{opt.desc}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Right Pane: Report Dashboard & Preview */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ marginBottom: 20 }}>
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A', fontFamily: fontStyle }}>{selectedReportType}</Text>
            <Text style={{ fontSize: 12, color: '#64748B', fontFamily: fontStyle, marginTop: 2 }}>Detailed live preview and customizable Excel exporting</Text>
          </View>

          {/* Controls Toolbar - 2 compact rows always visible */}
          <View style={{ marginBottom: 12 }}>
            {/* ROW 1: All filter dropdowns side-by-side */}
            <View style={{
              flexDirection: 'row',
              gap: 8,
              alignItems: 'center',
              marginBottom: 8,
              backgroundColor: '#F8FAFC',
              borderRadius: 12,
              padding: 10,
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}>
              {/* Driver Filter */}
              <View style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 8,
                backgroundColor: '#FFFFFF',
                paddingHorizontal: 8,
                height: 36,
                minWidth: 0,
              }}>
                <Ionicons name="person-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
                <select
                  style={{
                    flex: 1,
                    fontSize: 12,
                    border: 'none',
                    outline: 'none',
                    color: '#0F172A',
                    backgroundColor: 'transparent',
                    fontFamily: fontStyle,
                    cursor: 'pointer',
                    minWidth: 0,
                    width: '100%',
                  } as any}
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                >
                  <option value="">All Drivers</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </View>

              {/* Vehicle Filter */}
              <View style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 8,
                backgroundColor: '#FFFFFF',
                paddingHorizontal: 8,
                height: 36,
                minWidth: 0,
              }}>
                <Ionicons name="car-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
                <select
                  style={{
                    flex: 1,
                    fontSize: 12,
                    border: 'none',
                    outline: 'none',
                    color: '#0F172A',
                    backgroundColor: 'transparent',
                    fontFamily: fontStyle,
                    cursor: 'pointer',
                    minWidth: 0,
                    width: '100%',
                  } as any}
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                >
                  <option value="">All Vehicles</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.number} ({v.model})</option>
                  ))}
                </select>
              </View>

              {/* Duration Selector */}
              <View style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 8,
                backgroundColor: '#FFFFFF',
                paddingHorizontal: 8,
                height: 36,
                minWidth: 0,
              }}>
                <Ionicons name="time-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
                <select
                  style={{
                    flex: 1,
                    fontSize: 12,
                    border: 'none',
                    outline: 'none',
                    color: '#0F172A',
                    backgroundColor: 'transparent',
                    fontFamily: fontStyle,
                    cursor: 'pointer',
                    minWidth: 0,
                    width: '100%',
                  } as any}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">This Week (7 Days)</option>
                  <option value="month">This Month (30 Days)</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="1year">Last 1 Year</option>
                  <option value="custom">Custom Date Range...</option>
                </select>
              </View>
            </View>

            {/* ROW 2: Custom date pickers (only if custom) + Download button */}
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              {duration === 'custom' && (
                <>
                  <View style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#BFDBFE',
                    borderRadius: 8,
                    backgroundColor: '#EFF6FF',
                    paddingHorizontal: 10,
                    height: 36,
                  }}>
                    <Text style={{ fontSize: 10, color: '#1D4ED8', fontFamily: fontStyle, marginRight: 6, fontWeight: '800' }}>FROM:</Text>
                    <input
                      type="date"
                      value={customFromDate}
                      onChange={(e) => setCustomFromDate(e.target.value)}
                      style={{
                        flex: 1,
                        fontSize: 12,
                        border: 'none',
                        outline: 'none',
                        color: '#0F172A',
                        backgroundColor: 'transparent',
                        fontFamily: fontStyle,
                        cursor: 'pointer',
                        minWidth: 0,
                      } as any}
                    />
                  </View>

                  <View style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#BFDBFE',
                    borderRadius: 8,
                    backgroundColor: '#EFF6FF',
                    paddingHorizontal: 10,
                    height: 36,
                  }}>
                    <Text style={{ fontSize: 10, color: '#1D4ED8', fontFamily: fontStyle, marginRight: 6, fontWeight: '800' }}>TO:</Text>
                    <input
                      type="date"
                      value={customToDate}
                      onChange={(e) => setCustomToDate(e.target.value)}
                      style={{
                        flex: 1,
                        fontSize: 12,
                        border: 'none',
                        outline: 'none',
                        color: '#0F172A',
                        backgroundColor: 'transparent',
                        fontFamily: fontStyle,
                        cursor: 'pointer',
                        minWidth: 0,
                      } as any}
                    />
                  </View>
                </>
              )}

              {/* Download Report Button */}
              <TouchableOpacity
                style={[styles.panelAddBtn, { backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', height: 36, marginLeft: duration === 'custom' ? 0 : 'auto' as any }]}
                onPress={handleDownloadExcel}
              >
                <Ionicons name="download-outline" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={[styles.panelAddBtnText, { fontFamily: fontStyle, fontSize: 12 }]}>Download Excel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Dynamic Table Preview */}
        <View style={[styles.sectionCard, { flex: 1 }]}>
          <Text style={[styles.sectionTitle, { fontSize: 15, fontWeight: '800', fontFamily: fontStyle, marginBottom: 12 }]}>
            {selectedReportType === 'Driver Performance Report' && selectedDriverId ? 'DETAILED DRIVER TRIP HISTORY' : 
             selectedReportType === 'Vehicle Utilization Report' && selectedVehicleId ? 'DETAILED VEHICLE TRIP HISTORY' : 
             'REPORT DATA PREVIEW'}
          </Text>
          
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {selectedReportType === 'Trip Summary Report' && (
              <View>
                <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10 }]}>
                  <Text style={{ flex: 0.5, fontFamily: fontStyle, fontSize: 12, fontWeight: '800', color: '#475569' }}>S.NO</Text>
                  <Text style={{ flex: 1.0, fontFamily: fontStyle, fontSize: 12, fontWeight: '800', color: '#475569' }}>DATE</Text>
                  <Text style={{ flex: 1.2, fontFamily: fontStyle, fontSize: 12, fontWeight: '800', color: '#475569' }}>OPERATOR</Text>
                  <Text style={{ flex: 1.1, fontFamily: fontStyle, fontSize: 12, fontWeight: '800', color: '#475569' }}>VEHICLE</Text>
                  <Text style={{ flex: 0.9, textAlign: 'right', fontFamily: fontStyle, fontSize: 12, fontWeight: '800', color: '#475569', paddingRight: 6 }}>START ODO</Text>
                  <Text style={{ flex: 0.9, textAlign: 'right', fontFamily: fontStyle, fontSize: 12, fontWeight: '800', color: '#475569', paddingRight: 6 }}>END ODO</Text>
                  <Text style={{ flex: 0.9, textAlign: 'right', fontFamily: fontStyle, fontSize: 12, fontWeight: '800', color: '#475569', paddingRight: 6 }}>DIST (KM)</Text>
                  <Text style={{ flex: 0.9, textAlign: 'right', fontFamily: fontStyle, fontSize: 12, fontWeight: '800', color: '#475569', paddingRight: 6 }}>START HMR</Text>
                  <Text style={{ flex: 0.9, textAlign: 'right', fontFamily: fontStyle, fontSize: 12, fontWeight: '800', color: '#475569', paddingRight: 6 }}>END HMR</Text>
                  <Text style={{ flex: 1.0, textAlign: 'right', fontFamily: fontStyle, fontSize: 12, fontWeight: '800', color: '#475569', paddingRight: 6 }}>HMR WORKED</Text>
                  <Text style={{ flex: 1.0, textAlign: 'center', fontFamily: fontStyle, fontSize: 12, fontWeight: '800', color: '#475569', paddingRight: 6 }}>FUEL LEVEL</Text>
                  <Text style={{ flex: 1.2, textAlign: 'center', fontFamily: fontStyle, fontSize: 12, fontWeight: '800', color: '#475569', paddingRight: 6 }}>FUEL FILLING HMR</Text>
                </View>
                {filteredTrips.map((t, idx) => {
                  const d = drivers.find(drv => drv.id === t.driverId)?.name || 'Unknown';
                  const v = vehicles.find(veh => veh.id === t.vehicleId)?.number || 'Unknown';
                  const startOdoVal = parseFloat(t.startOdometer) || 0;
                  const endOdoVal = parseFloat(t.endOdometer) || 0;
                  const distVal = endOdoVal >= startOdoVal ? (endOdoVal - startOdoVal) : 0;
                  
                  const startHmrVal = parseFloat(t.startHmr) || 0;
                  const endHmrVal = parseFloat(t.endHmr) || 0;
                  const hmrWorkedVal = endHmrVal >= startHmrVal ? (endHmrVal - startHmrVal) : 0;

                  const fuelLevelVal = t.fuelLevel || t.fuel_level || '—';
                  const fuelFillingHmrVal = t.notes || '—';
                  
                  const tripFuel = fuelLogs.filter(f => f.vehicleId === t.vehicleId && (f.date === t.startDate || f.date === t.endDate));
                  const fuelCost = tripFuel.reduce((acc, f) => acc + (parseFloat(f.cost) || 0), 0);

                  return (
                    <View key={t.id} style={[styles.tableRow, { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F8FAFC' }]}>
                      <Text style={{ flex: 0.5, fontFamily: fontStyle, fontSize: 13, color: '#334155' }}>{idx + 1}</Text>
                      <Text style={{ flex: 1.0, fontFamily: fontStyle, fontSize: 13, color: '#334155' }}>{t.startDate}</Text>
                      <Text style={{ flex: 1.2, fontWeight: '700', fontFamily: fontStyle, fontSize: 13, color: '#1E293B' }} numberOfLines={1}>{d}</Text>
                      <Text style={{ flex: 1.1, fontFamily: fontStyle, fontSize: 13, color: '#334155' }} numberOfLines={1}>{v}</Text>
                      <Text style={{ flex: 0.9, textAlign: 'right', fontFamily: fontStyle, fontSize: 13, color: '#334155', paddingRight: 6 }}>{t.startOdometer || '0'}</Text>
                      <Text style={{ flex: 0.9, textAlign: 'right', fontFamily: fontStyle, fontSize: 13, color: '#334155', paddingRight: 6 }}>{t.endOdometer || '0'}</Text>
                      <Text style={{ flex: 0.9, textAlign: 'right', fontWeight: '700', fontFamily: fontStyle, fontSize: 13, color: '#1E293B', paddingRight: 6 }}>{t.endOdometer ? `${distVal} km` : '0 km'}</Text>
                      <Text style={{ flex: 0.9, textAlign: 'right', fontFamily: fontStyle, fontSize: 13, color: '#334155', paddingRight: 6 }}>{t.startHmr || '0'}</Text>
                      <Text style={{ flex: 0.9, textAlign: 'right', fontFamily: fontStyle, fontSize: 13, color: '#334155', paddingRight: 6 }}>{t.endHmr || '-'}</Text>
                      <Text style={{ flex: 1.0, textAlign: 'right', fontWeight: '700', fontFamily: fontStyle, fontSize: 13, color: '#0284C7', paddingRight: 6 }}>{t.endHmr ? `${hmrWorkedVal.toFixed(1)} hrs` : '-'}</Text>
                      <Text style={{ flex: 1.0, textAlign: 'center', fontFamily: fontStyle, fontSize: 13, color: '#334155', paddingRight: 6 }}>{fuelLevelVal}</Text>
                      <Text style={{ flex: 1.2, textAlign: 'center', fontFamily: fontStyle, fontSize: 13, color: '#334155', paddingRight: 6 }}>{fuelFillingHmrVal}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {selectedReportType === 'Fuel Report' && (
              <View>
                <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10 }]}>
                  <Text style={{ flex: 0.5, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>S.NO</Text>
                  <Text style={{ flex: 1.5, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>DATE</Text>
                  <Text style={{ flex: 1.5, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>VEHICLE</Text>
                  <Text style={{ flex: 1.8, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>DRIVER</Text>
                  <Text style={{ flex: 1.2, textAlign: 'right', fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>LITERS</Text>
                  <Text style={{ flex: 1.2, textAlign: 'right', fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>COST</Text>
                  <Text style={{ flex: 1.5, textAlign: 'right', fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>ODOMETER</Text>
                </View>
                {filteredFuel.map((f, idx) => {
                  const v = vehicles.find(veh => veh.id === f.vehicleId)?.number || 'Unknown';
                  const d = drivers.find(drv => drv.id === f.driverId)?.name || 'Unknown';
                  return (
                    <View key={f.id} style={[styles.tableRow, { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F8FAFC' }]}>
                      <Text style={{ flex: 0.5, fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{idx + 1}</Text>
                      <Text style={{ flex: 1.5, fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{f.date}</Text>
                      <Text style={{ flex: 1.5, fontWeight: '700', fontFamily: fontStyle, fontSize: 14, color: '#1E293B' }}>{v}</Text>
                      <Text style={{ flex: 1.8, fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{d}</Text>
                      <Text style={{ flex: 1.2, textAlign: 'right', fontWeight: '700', color: '#0284C7', fontFamily: fontStyle, fontSize: 14 }}>{f.liters} L</Text>
                      <Text style={{ flex: 1.2, textAlign: 'right', fontWeight: '700', color: '#10B981', fontFamily: fontStyle, fontSize: 14 }}>₹{f.cost}</Text>
                      <Text style={{ flex: 1.5, textAlign: 'right', fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{f.odometerReading} km</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {selectedReportType === 'Driver Performance Report' && (
              selectedDriverId ? (
                // Detailed single driver table
                <View>
                  <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10 }]}>
                    <Text style={{ flex: 0.5, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>S.NO</Text>
                    <Text style={{ flex: 1.5, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>DATE</Text>
                    <Text style={{ flex: 1.5, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>VEHICLE NO</Text>
                    <Text style={{ flex: 1.2, textAlign: 'right', fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>DIST (KM)</Text>
                    <Text style={{ flex: 1.2, textAlign: 'right', fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>HMR WORKED</Text>
                    <Text style={{ flex: 1.2, textAlign: 'center', fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>BREAKDOWN</Text>
                  </View>
                  {filteredTrips.filter(t => t.driverId === selectedDriverId).map((t, idx) => {
                    const v = vehicles.find(veh => veh.id === t.vehicleId)?.number || 'Unknown';
                    const start = parseFloat(t.startOdometer) || 0;
                    const end = parseFloat(t.endOdometer) || 0;
                    const dist = end >= start ? (end - start) : 0;
                    const startH = parseFloat(t.startHmr) || 0;
                    const endH = parseFloat(t.endHmr) || 0;
                    const hmr = endH >= startH ? (endH - startH) : 0;
                    return (
                      <View key={t.id} style={[styles.tableRow, { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F8FAFC' }]}>
                        <Text style={{ flex: 0.5, fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{idx + 1}</Text>
                        <Text style={{ flex: 1.5, fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{t.startDate}</Text>
                        <Text style={{ flex: 1.5, fontWeight: '700', fontFamily: fontStyle, fontSize: 14, color: '#1E293B' }}>{v}</Text>
                        <Text style={{ flex: 1.2, textAlign: 'right', fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{dist} km</Text>
                        <Text style={{ flex: 1.2, textAlign: 'right', fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{hmr.toFixed(1)} hrs</Text>
                        <Text style={{ flex: 1.2, textAlign: 'center', fontWeight: '800', color: t.isBreakdown ? '#EF4444' : '#10B981', fontFamily: fontStyle, fontSize: 14 }}>{t.isBreakdown ? 'YES' : 'NO'}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                // Summary list table
                <View>
                  <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10 }]}>
                    <Text style={{ flex: 0.5, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>S.NO</Text>
                    <Text style={{ flex: 2, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>DRIVER NAME</Text>
                    <Text style={{ flex: 1.2, textAlign: 'right', fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>TOTAL TRIPS</Text>
                    <Text style={{ flex: 1.2, textAlign: 'right', fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>DAY SHIFTS</Text>
                    <Text style={{ flex: 1.2, textAlign: 'right', fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>NIGHT SHIFTS</Text>
                    <Text style={{ flex: 1.2, textAlign: 'right', fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>BREAKDOWNS</Text>
                    <Text style={{ flex: 1.2, textAlign: 'right', fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>BILLING DAYS</Text>
                  </View>
                  {drivers.map((driver, idx) => {
                    const dTrips = filteredTrips.filter(t => t.driverId === driver.id);
                    const dayShifts = dTrips.filter(t => (t.shift || '').toLowerCase().includes('day')).length;
                    const nightShifts = dTrips.filter(t => (t.shift || '').toLowerCase().includes('night')).length;
                    const breakdowns = dTrips.filter(t => t.isBreakdown).length;
                    const billingDays = Math.max(0, dTrips.length - breakdowns);
                    return (
                      <View key={driver.id} style={[styles.tableRow, { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F8FAFC' }]}>
                        <Text style={{ flex: 0.5, fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{idx + 1}</Text>
                        <Text style={{ flex: 2, fontWeight: '700', fontFamily: fontStyle, fontSize: 14, color: '#1E293B' }}>{driver.name}</Text>
                        <Text style={{ flex: 1.2, textAlign: 'right', fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{dTrips.length}</Text>
                        <Text style={{ flex: 1.2, textAlign: 'right', fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{dayShifts}</Text>
                        <Text style={{ flex: 1.2, textAlign: 'right', fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{nightShifts}</Text>
                        <Text style={{ flex: 1.2, textAlign: 'right', color: breakdowns > 0 ? '#EF4444' : '#64748B', fontFamily: fontStyle, fontSize: 14 }}>{breakdowns}</Text>
                        <Text style={{ flex: 1.2, textAlign: 'right', fontWeight: '700', color: '#10B981', fontFamily: fontStyle, fontSize: 14 }}>{billingDays}</Text>
                      </View>
                    );
                  })}
                </View>
              )
            )}

            {selectedReportType === 'Vehicle Utilization Report' && (
              selectedVehicleId ? (
                // Detailed single vehicle table
                <View>
                  <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10 }]}>
                    <Text style={{ flex: 0.5, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>S.NO</Text>
                    <Text style={{ flex: 1.5, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>DATE</Text>
                    <Text style={{ flex: 1.8, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>OPERATOR DRIVER</Text>
                    <Text style={{ flex: 1.2, textAlign: 'right', fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>DIST (KM)</Text>
                    <Text style={{ flex: 1.2, textAlign: 'right', fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>FUEL CONSUMED</Text>
                    <Text style={{ flex: 1.2, textAlign: 'right', fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>MAINT COST</Text>
                  </View>
                  {filteredTrips.filter(t => t.vehicleId === selectedVehicleId).map((t, idx) => {
                    const dName = drivers.find(d => d.id === t.driverId)?.name || 'Unknown';
                    const start = parseFloat(t.startOdometer) || 0;
                    const end = parseFloat(t.endOdometer) || 0;
                    const dist = end >= start ? (end - start) : 0;
                    
                    const dateRefills = filteredFuel.filter(f => f.vehicleId === selectedVehicleId && f.date === t.startDate);
                    const totalFuel = dateRefills.reduce((acc, f) => acc + (parseFloat(f.liters) || 0), 0);
                    
                    const dateMaint = filteredMaint.filter(m => m.vehicleId === selectedVehicleId && m.date === t.startDate);
                    const totalMaint = dateMaint.reduce((acc, m) => acc + (parseFloat(m.cost) || 0), 0);
 
                    return (
                      <View key={t.id} style={[styles.tableRow, { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F8FAFC' }]}>
                        <Text style={{ flex: 0.5, fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{idx + 1}</Text>
                        <Text style={{ flex: 1.5, fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{t.startDate}</Text>
                        <Text style={{ flex: 1.8, fontWeight: '700', fontFamily: fontStyle, fontSize: 14, color: '#1E293B' }}>{dName}</Text>
                        <Text style={{ flex: 1.2, textAlign: 'right', fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{dist} km</Text>
                        <Text style={{ flex: 1.2, textAlign: 'right', color: '#0284C7', fontFamily: fontStyle, fontSize: 14 }}>{totalFuel > 0 ? `${totalFuel} L` : '—'}</Text>
                        <Text style={{ flex: 1.2, textAlign: 'right', color: '#EF4444', fontFamily: fontStyle, fontSize: 14 }}>{totalMaint > 0 ? `₹${totalMaint}` : '—'}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                // Summary list table
                <View>
                  <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10 }]}>
                    <Text style={{ flex: 0.5, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>S.NO</Text>
                    <Text style={{ flex: 2, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>VEHICLE NO</Text>
                    <Text style={{ flex: 2.5, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>MODEL</Text>
                    <Text style={{ flex: 1.5, textAlign: 'right', fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>TOTAL TRIPS</Text>
                    <Text style={{ flex: 2, textAlign: 'right', fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>DISTANCE RUN</Text>
                  </View>
                  {vehicles.map((veh, idx) => {
                    const vTrips = filteredTrips.filter(t => t.vehicleId === veh.id);
                    const totalDist = vTrips.reduce((acc, t) => {
                      const start = parseFloat(t.startOdometer) || 0;
                      const end = parseFloat(t.endOdometer) || 0;
                      return acc + (end >= start ? end - start : 0);
                    }, 0);
                    return (
                      <View key={veh.id} style={[styles.tableRow, { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F8FAFC' }]}>
                        <Text style={{ flex: 0.5, fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{idx + 1}</Text>
                        <Text style={{ flex: 2, fontWeight: '700', fontFamily: fontStyle, fontSize: 14, color: '#1E293B' }}>{veh.number}</Text>
                        <Text style={{ flex: 2.5, fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{veh.model}</Text>
                        <Text style={{ flex: 1.5, textAlign: 'right', fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{vTrips.length}</Text>
                        <Text style={{ flex: 2, textAlign: 'right', fontWeight: '700', color: '#8B5CF6', fontFamily: fontStyle, fontSize: 14 }}>{totalDist.toLocaleString()} km</Text>
                      </View>
                    );
                  })}
                </View>
              )
            )}

            {selectedReportType === 'Maintenance Report' && (
              <View>
                <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10 }]}>
                  <Text style={{ flex: 0.5, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>S.NO</Text>
                  <Text style={{ flex: 1.5, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>DATE</Text>
                  <Text style={{ flex: 1.5, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>VEHICLE</Text>
                  <Text style={{ flex: 1.8, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>DRIVER</Text>
                  <Text style={{ flex: 2, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>TYPE</Text>
                  <Text style={{ flex: 1.2, textAlign: 'right', fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>COST</Text>
                </View>
                {filteredMaint.map((m, idx) => {
                  const v = vehicles.find(veh => veh.id === m.vehicleId)?.number || 'Unknown';
                  const d = drivers.find(drv => drv.id === m.driverId)?.name || 'Unknown';
                  return (
                    <View key={m.id} style={[styles.tableRow, { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F8FAFC' }]}>
                      <Text style={{ flex: 0.5, fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{idx + 1}</Text>
                      <Text style={{ flex: 1.5, fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{m.date}</Text>
                      <Text style={{ flex: 1.5, fontWeight: '700', fontFamily: fontStyle, fontSize: 14, color: '#1E293B' }}>{v}</Text>
                      <Text style={{ flex: 1.8, fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{d}</Text>
                      <Text style={{ flex: 2, color: '#F59E0B', fontWeight: '700', fontFamily: fontStyle, fontSize: 14 }} numberOfLines={1}>{m.maintenanceType}</Text>
                      <Text style={{ flex: 1.2, textAlign: 'right', fontWeight: '700', color: '#EF4444', fontFamily: fontStyle, fontSize: 14 }}>₹{m.cost}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {selectedReportType === 'Breakdown Report' && (
              <View>
                <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10 }]}>
                  <Text style={{ flex: 0.5, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>S.NO</Text>
                  <Text style={{ flex: 1.5, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>VEHICLE NO</Text>
                  <Text style={{ flex: 1.5, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>DATE</Text>
                  <Text style={{ flex: 1.2, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>DOWN TIME</Text>
                  <Text style={{ flex: 1.2, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>ACTIVE TIME</Text>
                  <Text style={{ flex: 2.5, fontFamily: fontStyle, fontSize: 13, fontWeight: '800', color: '#475569' }}>REMARKS / ISSUE</Text>
                </View>
                {filteredMaint.filter(m => m.isBreakdownReport || m.maintenanceType === 'Breakdown Report' || m.maintenanceType === 'Breakdown' || m.maintenanceType === 'Breakdown Resolution').map((m, idx) => {
                  const v = vehicles.find(veh => veh.id === m.vehicleId)?.number || 'Unknown';
                  
                  let bdTime = m.time || '—';
                  let actTime = '—';
                  if (m.description?.includes('Breakdown Time:')) {
                    const matchBD = m.description.match(/Breakdown Time: (.*?) \|/);
                    if (matchBD) bdTime = matchBD[1]?.trim();
                    const matchAct = m.description.match(/Active Time: (.*)/);
                    if (matchAct) actTime = matchAct[1]?.trim();
                  }

                  return (
                    <View key={m.id} style={[styles.tableRow, { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F8FAFC' }]}>
                      <Text style={{ flex: 0.5, fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{idx + 1}</Text>
                      <Text style={{ flex: 1.5, fontWeight: '700', fontFamily: fontStyle, fontSize: 14, color: '#1E293B' }}>{v}</Text>
                      <Text style={{ flex: 1.5, fontFamily: fontStyle, fontSize: 14, color: '#334155' }}>{m.date}</Text>
                      <Text style={{ flex: 1.2, fontFamily: fontStyle, fontSize: 14, color: '#DC2626', fontWeight: '700' }}>{bdTime}</Text>
                      <Text style={{ flex: 1.2, fontFamily: fontStyle, fontSize: 14, color: '#10B981', fontWeight: '700' }}>{actTime}</Text>
                      <Text style={{ flex: 2.5, fontFamily: fontStyle, fontSize: 14, color: '#334155', fontStyle: 'italic' }}>{m.serviceNotes || m.description || '—'}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}
