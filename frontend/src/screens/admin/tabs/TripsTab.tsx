import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Pressable, Image } from 'react-native';
import { useDashboardData } from '../../../context/DashboardDataContext';
import { styles, fontStyle } from '../AdminStyles';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../api/client';

export default function TripsTab() {
  const { trips, drivers, vehicles } = useDashboardData();
  const [tripDriverFilter, setTripDriverFilter] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [fullscreenImageUri, setFullscreenImageUri] = useState<string | null>(null);
  const [tripVehicleFilter, setTripVehicleFilter] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [driverDropdownOpen, setDriverDropdownOpen] = useState(false);
  const [vehicleDropdownOpen, setVehicleDropdownOpen] = useState(false);

  // Parse DD/MM/YYYY -> Date
  const parseDate = (str: string): Date | null => {
    if (!str) return null;
    const parts = str.split('/');
    if (parts.length !== 3) return null;
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  };

  const filteredTrips = trips.filter((t) => {
    if (tripDriverFilter && t.driverId !== tripDriverFilter) return false;
    if (tripVehicleFilter && t.vehicleId !== tripVehicleFilter) return false;
    const recordDate = parseDate(t.startDate);
    if (filterFromDate && (!recordDate || recordDate < new Date(filterFromDate))) return false;
    if (filterToDate && (!recordDate || recordDate > new Date(filterToDate))) return false;
    return true;
  });

  const sortedTrips = [...filteredTrips].sort((a, b) => {
    const dateA = parseDate(a.startDate) || new Date(0);
    const dateB = parseDate(b.startDate) || new Date(0);
    if (dateB.getTime() !== dateA.getTime()) {
      return dateB.getTime() - dateA.getTime();
    }
    const timeA = a.startTime || '';
    const timeB = b.startTime || '';
    return timeB.localeCompare(timeA);
  });

  const hasFilters = tripDriverFilter || tripVehicleFilter || filterFromDate || filterToDate;

  return (
    <View style={{ flex: 1 }}>
      <View style={[styles.sectionCard, { flex: 1 }]}>
        {/* Header Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View>
            <Text style={[styles.sectionTitle, { fontSize: 16, fontWeight: '800', fontFamily: fontStyle }]}>TRIP LOGS HISTORY</Text>
            <Text style={{ fontSize: 11, color: '#64748B', fontFamily: fontStyle, marginTop: 2 }}>
              Showing {filteredTrips.length} of {trips.length} total missions
            </Text>
          </View>
        </View>

        {/* Modern Filter Row */}
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          backgroundColor: '#F8FAFC',
          borderWidth: 1,
          borderColor: '#E2E8F0',
          borderRadius: 12,
          padding: 12,
          marginBottom: 24,
          zIndex: 10,
        }}>
          <Ionicons name="filter-outline" size={18} color="#64748B" style={{ marginRight: 12 }} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginRight: 16, fontFamily: fontStyle }}>Filter by:</Text>

          {/* Driver Dropdown Trigger */}
          <View style={{ position: 'relative', marginRight: 12, zIndex: 12 }}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 12,
              }}
              onPress={() => {
                setDriverDropdownOpen(!driverDropdownOpen);
                setVehicleDropdownOpen(false);
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B', fontFamily: fontStyle, marginRight: 6 }}>
                Driver: {tripDriverFilter ? (drivers.find(d => d.id === tripDriverFilter)?.name || 'Selected') : 'All'}
              </Text>
              <Ionicons name="chevron-down-outline" size={12} color="#64748B" />
            </TouchableOpacity>

            {driverDropdownOpen && (
              <View style={{
                position: 'absolute',
                top: 38,
                left: 0,
                width: 200,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                padding: 6,
              }}>
                <ScrollView style={{ maxHeight: 200 }}>
                  <TouchableOpacity
                    style={{ padding: 8, borderRadius: 6, backgroundColor: !tripDriverFilter ? '#EFF6FF' : 'transparent' }}
                    onPress={() => {
                      setTripDriverFilter('');
                      setDriverDropdownOpen(false);
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: !tripDriverFilter ? '700' : '500', color: !tripDriverFilter ? '#1D4ED8' : '#334155', fontFamily: fontStyle }}>All Drivers</Text>
                  </TouchableOpacity>
                  {drivers.map((d) => {
                    const isSel = tripDriverFilter === d.id;
                    return (
                      <TouchableOpacity
                        key={d.id}
                        style={{ padding: 8, borderRadius: 6, backgroundColor: isSel ? '#EFF6FF' : 'transparent', marginTop: 2 }}
                        onPress={() => {
                          setTripDriverFilter(d.id);
                          setDriverDropdownOpen(false);
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: isSel ? '700' : '500', color: isSel ? '#1D4ED8' : '#334155', fontFamily: fontStyle }}>{d.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Vehicle Dropdown Trigger */}
          <View style={{ position: 'relative', marginRight: 12, zIndex: 11 }}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 12,
              }}
              onPress={() => {
                setVehicleDropdownOpen(!vehicleDropdownOpen);
                setDriverDropdownOpen(false);
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#1E293B', fontFamily: fontStyle, marginRight: 6 }}>
                Vehicle: {tripVehicleFilter ? (vehicles.find(v => v.id === tripVehicleFilter)?.number || 'Selected') : 'All'}
              </Text>
              <Ionicons name="chevron-down-outline" size={12} color="#64748B" />
            </TouchableOpacity>

            {vehicleDropdownOpen && (
              <View style={{
                position: 'absolute',
                top: 38,
                left: 0,
                width: 200,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                padding: 6,
              }}>
                <ScrollView style={{ maxHeight: 200 }}>
                  <TouchableOpacity
                    style={{ padding: 8, borderRadius: 6, backgroundColor: !tripVehicleFilter ? '#EFF6FF' : 'transparent' }}
                    onPress={() => {
                      setTripVehicleFilter('');
                      setVehicleDropdownOpen(false);
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: !tripVehicleFilter ? '700' : '500', color: !tripVehicleFilter ? '#1D4ED8' : '#334155', fontFamily: fontStyle }}>All Vehicles</Text>
                  </TouchableOpacity>
                  {vehicles.map((v) => {
                    const isSel = tripVehicleFilter === v.id;
                    return (
                      <TouchableOpacity
                        key={v.id}
                        style={{ padding: 8, borderRadius: 6, backgroundColor: isSel ? '#EFF6FF' : 'transparent', marginTop: 2 }}
                        onPress={() => {
                          setTripVehicleFilter(v.id);
                          setVehicleDropdownOpen(false);
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: isSel ? '700' : '500', color: isSel ? '#1D4ED8' : '#334155', fontFamily: fontStyle }}>{v.number}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* From Date */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            borderRadius: 8,
            paddingVertical: 4,
            paddingHorizontal: 12,
            marginRight: 12,
            overflow: 'hidden',
          }}>
            <Ionicons name="calendar-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 11, color: '#64748B', marginRight: 4, fontFamily: fontStyle }}>From</Text>
            <input
              type="date"
              style={{
                padding: '4px 0',
                fontSize: 12,
                border: 'none',
                outline: 'none',
                color: filterFromDate ? '#0F172A' : '#94A3B8',
                backgroundColor: 'transparent',
                fontFamily: fontStyle,
                cursor: 'pointer',
              } as any}
              value={filterFromDate}
              onChange={(e: any) => setFilterFromDate(e.target.value)}
            />
          </View>

          {/* To Date */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#FFFFFF',
            borderWidth: 1,
            borderColor: '#E2E8F0',
            borderRadius: 8,
            paddingVertical: 4,
            paddingHorizontal: 12,
            marginRight: 12,
            overflow: 'hidden',
          }}>
            <Ionicons name="calendar-outline" size={14} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 11, color: '#64748B', marginRight: 4, fontFamily: fontStyle }}>To</Text>
            <input
              type="date"
              style={{
                padding: '4px 0',
                fontSize: 12,
                border: 'none',
                outline: 'none',
                color: filterToDate ? '#0F172A' : '#94A3B8',
                backgroundColor: 'transparent',
                fontFamily: fontStyle,
                cursor: 'pointer',
              } as any}
              value={filterToDate}
              onChange={(e: any) => setFilterToDate(e.target.value)}
            />
          </View>

          {/* Clear Button */}
          {hasFilters ? (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FEF2F2',
                borderRadius: 8,
                paddingVertical: 8,
                paddingHorizontal: 12,
              }}
              onPress={() => {
                setTripDriverFilter('');
                setTripVehicleFilter('');
                setFilterFromDate('');
                setFilterToDate('');
              }}
            >
              <Ionicons name="refresh-outline" size={12} color="#EF4444" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444', fontFamily: fontStyle }}>Reset Filters</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Custom Spaced Table Header Row (Fixed) */}
        <View style={[styles.tableHeaderRow, { borderBottomWidth: 1, borderColor: '#E2E8F0', paddingBottom: 10, marginBottom: 0 }]}>
          <Text style={[styles.tableHeaderCell, { flex: 0.6, fontFamily: fontStyle }]}>S.NO</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.4, fontFamily: fontStyle }]}>START TIME</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.4, fontFamily: fontStyle }]}>END TIME</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.6, fontFamily: fontStyle }]}>OPERATOR DRIVER</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2, fontFamily: fontStyle }]}>VEHICLE NO</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right', fontFamily: fontStyle }]}>ODOMETER PROGRESS</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right', fontFamily: fontStyle }]}>HMR PROGRESS</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.0, textAlign: 'center', fontFamily: fontStyle }]}>STATUS</Text>
        </View>

        {/* Scrollable table rows */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.table}>
            {sortedTrips.map((trip, idx) => {
              const driverObj = drivers.find((d) => d.id === trip.driverId);
              const driverName = driverObj?.name || 'Unknown';
              const initials = driverName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

              const vehicleObj = vehicles.find((v) => v.id === trip.vehicleId);
              const plateNo = vehicleObj?.number || 'Unknown';

              // Status badges
              const isDone = trip.status === 'submitted' || trip.status === 'completed';
              const statusBg = isDone ? '#EFF6FF' : '#FFF7ED';
              const statusBorder = isDone ? '#DBEAFE' : '#FFEDD5';
              const statusText = isDone ? '#1D4ED8' : '#EA580C';

              return (
                <TouchableOpacity
                  key={trip.id}
                  onPress={async () => {
                    try {
                      const res = await apiClient.get(`/trips/${trip.id}`);
                      if (res.data && res.data.success) {
                        setSelectedTrip(res.data.data);
                      } else {
                        setSelectedTrip(trip);
                      }
                    } catch (e) {
                      setSelectedTrip(trip);
                    }
                  }}
                  activeOpacity={0.7}
                  style={[styles.tableRow, { borderBottomWidth: 1, borderColor: '#F8FAFC', paddingVertical: 14 }]}
                >
                  {/* S.No Cell */}
                  <Text style={[styles.tableCell, { flex: 0.6, color: '#64748B', fontWeight: 'bold', fontFamily: fontStyle }]}>{idx + 1}</Text>

                  {/* Start Time Cell */}
                  <View style={{ flex: 1.4, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#334155', fontWeight: '600', fontFamily: fontStyle }}>{trip.startDate}</Text>
                    {trip.startTime ? (
                      <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontFamily: fontStyle }}>{trip.startTime}</Text>
                    ) : null}
                  </View>

                  {/* End Time Cell */}
                  <View style={{ flex: 1.4, flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                    {trip.endDate ? (
                      <>
                        <Text style={{ fontSize: 13, color: '#334155', fontWeight: '600', fontFamily: fontStyle }}>{trip.endDate}</Text>
                        {trip.endTime ? (
                          <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2, fontFamily: fontStyle }}>{trip.endTime}</Text>
                        ) : null}
                      </>
                    ) : (
                      <Text style={{ fontSize: 12, color: isDone ? '#64748B' : '#10B981', fontWeight: isDone ? '500' : '700', fontFamily: fontStyle }}>
                        {isDone ? 'N/A' : 'Active'}
                      </Text>
                    )}
                  </View>

                  {/* Driver avatar cell */}
                  <View style={{ flex: 1.6, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: '#F59E0B15',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 10,
                      borderWidth: 1,
                      borderColor: '#F59E0B25',
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#EA580C', fontFamily: fontStyle }}>{initials}</Text>
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A', fontFamily: fontStyle }} numberOfLines={1}>{driverName}</Text>
                  </View>

                  {/* Vehicle plate cell */}
                  <View style={{ flex: 1.2, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      backgroundColor: '#FFF',
                      borderWidth: 1.5,
                      borderColor: '#1E293B',
                      borderRadius: 4,
                      paddingVertical: 3,
                      paddingHorizontal: 8,
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#1E293B', letterSpacing: 0.5, fontFamily: 'monospace' }}>{plateNo}</Text>
                    </View>
                  </View>

                  {/* Odometer progress */}
                  <View style={{ flex: 1.5, alignItems: 'flex-end', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E293B', fontFamily: fontStyle, textAlign: 'right' }}>
                      {trip.startOdometer} km <Text style={{ color: '#94A3B8', fontWeight: '500' }}>→</Text> {trip.endOdometer ? `${trip.endOdometer} km` : '-'}
                    </Text>
                    {trip.endOdometer ? (
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#10B981', marginTop: 2, fontFamily: fontStyle, textAlign: 'right' }}>
                        ({(parseInt(trip.endOdometer) - parseInt(trip.startOdometer))} km)
                      </Text>
                    ) : null}
                  </View>

                  {/* HMR Progress */}
                  <View style={{ flex: 1.5, alignItems: 'flex-end', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#0284C7', fontFamily: fontStyle, textAlign: 'right' }}>
                      {trip.startHmr || '0'} <Text style={{ color: '#94A3B8', fontWeight: '500' }}>→</Text> {trip.endHmr ? `${trip.endHmr} hrs` : '-'}
                    </Text>
                    {trip.endHmr ? (
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#0284C7', marginTop: 2, fontFamily: fontStyle, textAlign: 'right' }}>
                        ({(parseFloat(trip.endHmr) - parseFloat(trip.startHmr || '0')).toFixed(1)} hrs)
                      </Text>
                    ) : null}
                  </View>

                  {/* Status pill badge */}
                  <View style={{ flex: 1.0, alignItems: 'center' }}>
                    <View style={{
                      backgroundColor: statusBg,
                      borderColor: statusBorder,
                      borderWidth: 1,
                      paddingVertical: 3,
                      paddingHorizontal: 8,
                      borderRadius: 6,
                    }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: statusText, fontFamily: fontStyle }}>
                        {isDone ? 'COMPLETED' : 'ACTIVE'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* TRIP DETAIL INSPECT MODAL */}
      <Modal
        visible={selectedTrip !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTrip(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 }}
          onPress={() => setSelectedTrip(null)}
        >
          <Pressable
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 32,
              width: '100%',
              maxWidth: 960,
              maxHeight: '90%',
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 20,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedTrip && (() => {
              const driverObj = drivers.find((d) => d.id === selectedTrip.driverId);
              const vehicleObj = vehicles.find((v) => v.id === selectedTrip.vehicleId);
              const driverName = driverObj?.name || 'Unknown Operator';
              const plateNo = vehicleObj?.number || 'Unknown Vehicle';
              const vehicleModel = vehicleObj?.model || '—';
              const isDone = selectedTrip.status === 'submitted' || selectedTrip.status === 'completed';

              return (
                <View style={{ flex: 1 }}>
                  {/* Modal Header */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <View>
                      <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A', fontFamily: fontStyle }}>
                        TRIP INSPECTION RECORD
                      </Text>
                      <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2, fontFamily: fontStyle }}>
                        ID: {selectedTrip.id.toUpperCase()} • Driver: {driverName} • Vehicle: {plateNo}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedTrip(null)} style={{ padding: 6, backgroundColor: '#F1F5F9', borderRadius: 20 }}>
                      <Ionicons name="close" size={20} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  <View style={{ height: 1, backgroundColor: '#E2E8F0', marginBottom: 24 }} />

                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {/* Left Column: Info Grid */}
                    <View style={{ flex: 1, minWidth: 320, paddingRight: 24 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E293B', marginBottom: 16, fontFamily: fontStyle }}>
                        MISSION INFORMATION
                      </Text>

                      <View style={{ backgroundColor: '#F8FAFC', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', fontFamily: fontStyle }}>STATUS</Text>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: isDone ? '#10B981' : '#EA580C', fontFamily: fontStyle }}>
                            {isDone ? 'COMPLETED' : 'ACTIVE IN PROGRESS'}
                          </Text>
                        </View>
                        <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', fontFamily: fontStyle }}>ROUTE</Text>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A', fontFamily: fontStyle }}>
                            {selectedTrip.sourceLocation} → {selectedTrip.destinationLocation}
                          </Text>
                        </View>
                        <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', fontFamily: fontStyle }}>PLACE / DEPOT</Text>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A', fontFamily: fontStyle }}>
                            {vehicleObj?.place || '—'}
                          </Text>
                        </View>
                        <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', fontFamily: fontStyle }}>START TIME</Text>
                          <Text style={{ fontSize: 12, fontWeight: '600', color: '#0F172A', fontFamily: fontStyle }}>
                            {selectedTrip.startDate} • {selectedTrip.startTime || '—'}
                          </Text>
                        </View>
                        {isDone && (
                          <>
                            <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', fontFamily: fontStyle }}>END TIME</Text>
                              <Text style={{ fontSize: 12, fontWeight: '600', color: '#0F172A', fontFamily: fontStyle }}>
                                {selectedTrip.endDate} • {selectedTrip.endTime || '—'}
                              </Text>
                            </View>
                          </>
                        )}
                        <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', fontFamily: fontStyle }}>START ODO</Text>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', fontFamily: fontStyle }}>
                            {selectedTrip.startOdometer} km
                          </Text>
                        </View>
                        {isDone && (
                          <>
                            <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', fontFamily: fontStyle }}>END ODO</Text>
                              <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', fontFamily: fontStyle }}>
                                {selectedTrip.endOdometer} km
                              </Text>
                            </View>
                            <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', fontFamily: fontStyle }}>TOTAL ODO WORKED</Text>
                              <Text style={{ fontSize: 12, fontWeight: '800', color: '#1D4ED8', fontFamily: fontStyle }}>
                                {parseInt(selectedTrip.endOdometer) - parseInt(selectedTrip.startOdometer)} km
                              </Text>
                            </View>
                          </>
                        )}
                        <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', fontFamily: fontStyle }}>START HMR</Text>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', fontFamily: fontStyle }}>
                            {selectedTrip.startHmr || '0'} hrs
                          </Text>
                        </View>
                        <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', fontFamily: fontStyle }}>END HMR</Text>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#0284C7', fontFamily: fontStyle }}>
                            {selectedTrip.endHmr ? `${selectedTrip.endHmr} hrs` : '-'}
                          </Text>
                        </View>
                        {isDone && selectedTrip.startHmr && selectedTrip.endHmr && (
                          <>
                            <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', fontFamily: fontStyle }}>TOTAL HMR WORKED</Text>
                              <Text style={{ fontSize: 12, fontWeight: '800', color: '#0284C7', fontFamily: fontStyle }}>
                                {(parseFloat(selectedTrip.endHmr) - parseFloat(selectedTrip.startHmr)).toFixed(1)} hrs
                              </Text>
                            </View>
                          </>
                        )}
                        {selectedTrip.notes ? (
                          <>
                            <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 }} />
                            <View style={{ flexDirection: 'column' }}>
                              <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8', fontFamily: fontStyle, marginBottom: 4 }}>OPERATOR NOTES</Text>
                              <Text style={{ fontSize: 12, color: '#334155', fontFamily: fontStyle, fontStyle: 'italic' }}>
                                "{selectedTrip.notes}"
                              </Text>
                            </View>
                          </>
                        ) : null}
                      </View>
                    </View>

                    {/* Right Column: Verification Photos */}
                    <View style={{ flex: 1.2, minWidth: 360 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E293B', marginBottom: 16, fontFamily: fontStyle }}>
                        UPLOADED VERIFICATION PHOTOS
                      </Text>

                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                        {/* 1. Start Odometer Image */}
                        <View style={{ width: '47%', minWidth: 160, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#475569', marginBottom: 8, textAlign: 'center', fontFamily: fontStyle }}>
                            START ODOMETER
                          </Text>
                          {selectedTrip.startOdometerPhotoUri ? (
                            <TouchableOpacity onPress={() => setFullscreenImageUri(selectedTrip.startOdometerPhotoUri)}>
                              <Image
                                source={{ uri: selectedTrip.startOdometerPhotoUri }}
                                style={{ width: '100%', height: 120, borderRadius: 8, resizeMode: 'cover' }}
                              />
                              <Text style={{ fontSize: 9, color: '#1D4ED8', fontWeight: '700', marginTop: 6, textAlign: 'center', fontFamily: fontStyle }}>
                                Click to Inspect
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={{ width: '100%', height: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 8 }}>
                              <Ionicons name="image-outline" size={24} color="#CBD5E1" />
                              <Text style={{ fontSize: 9, color: '#94A3B8', marginTop: 4, fontFamily: fontStyle }}>No Photo Uploaded</Text>
                            </View>
                          )}
                        </View>

                        {/* 2. Start Vehicle Front/Plate Image */}
                        <View style={{ width: '47%', minWidth: 160, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#475569', marginBottom: 8, textAlign: 'center', fontFamily: fontStyle }}>
                            VEHICLE PLATE
                          </Text>
                          {selectedTrip.startVehiclePlatePhotoUri ? (
                            <TouchableOpacity onPress={() => setFullscreenImageUri(selectedTrip.startVehiclePlatePhotoUri)}>
                              <Image
                                source={{ uri: selectedTrip.startVehiclePlatePhotoUri }}
                                style={{ width: '100%', height: 120, borderRadius: 8, resizeMode: 'cover' }}
                              />
                              <Text style={{ fontSize: 9, color: '#1D4ED8', fontWeight: '700', marginTop: 6, textAlign: 'center', fontFamily: fontStyle }}>
                                Click to Inspect
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={{ width: '100%', height: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 8 }}>
                              <Ionicons name="image-outline" size={24} color="#CBD5E1" />
                              <Text style={{ fontSize: 9, color: '#94A3B8', marginTop: 4, fontFamily: fontStyle }}>No Photo Uploaded</Text>
                            </View>
                          )}
                        </View>

                        {/* 3. End Odometer Image */}
                        <View style={{ width: '47%', minWidth: 160, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#475569', marginBottom: 8, textAlign: 'center', fontFamily: fontStyle }}>
                            END ODOMETER
                          </Text>
                          {selectedTrip.endOdometerPhotoUri ? (
                            <TouchableOpacity onPress={() => setFullscreenImageUri(selectedTrip.endOdometerPhotoUri)}>
                              <Image
                                source={{ uri: selectedTrip.endOdometerPhotoUri }}
                                style={{ width: '100%', height: 120, borderRadius: 8, resizeMode: 'cover' }}
                              />
                              <Text style={{ fontSize: 9, color: '#1D4ED8', fontWeight: '700', marginTop: 6, textAlign: 'center', fontFamily: fontStyle }}>
                                Click to Inspect
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={{ width: '100%', height: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 8 }}>
                              <Ionicons name="image-outline" size={24} color="#CBD5E1" />
                              <Text style={{ fontSize: 9, color: '#94A3B8', marginTop: 4, fontFamily: fontStyle }}>No Photo Uploaded</Text>
                            </View>
                          )}
                        </View>

                        {/* 4. Log Sheet Image */}
                        <View style={{ width: '47%', minWidth: 160, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#475569', marginBottom: 8, textAlign: 'center', fontFamily: fontStyle }}>
                            LOG SHEET
                          </Text>
                          {selectedTrip.sheetPhotoUri ? (
                            <TouchableOpacity onPress={() => setFullscreenImageUri(selectedTrip.sheetPhotoUri)}>
                              <Image
                                source={{ uri: selectedTrip.sheetPhotoUri }}
                                style={{ width: '100%', height: 120, borderRadius: 8, resizeMode: 'cover' }}
                              />
                              <Text style={{ fontSize: 9, color: '#1D4ED8', fontWeight: '700', marginTop: 6, textAlign: 'center', fontFamily: fontStyle }}>
                                Click to Inspect
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={{ width: '100%', height: 120, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 8 }}>
                              <Ionicons name="image-outline" size={24} color="#CBD5E1" />
                              <Text style={{ fontSize: 9, color: '#94A3B8', marginTop: 4, fontFamily: fontStyle }}>No Photo Uploaded</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  </ScrollView>
                </View>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>

      {/* FULLSCREEN IMAGE INSPECTOR */}
      <Modal
        visible={fullscreenImageUri !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenImageUri(null)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 16 }}
          onPress={() => setFullscreenImageUri(null)}
        >
          {fullscreenImageUri && (
            <View style={{ width: '90%', height: '90%', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
              <Image
                source={{ uri: fullscreenImageUri }}
                style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
              />
              <TouchableOpacity
                onPress={() => setFullscreenImageUri(null)}
                style={{ position: 'absolute', top: 20, right: 20, padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 30 }}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
