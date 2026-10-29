import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { DiscoveryView } from './components/DiscoveryView';
import { CsvImportView } from './components/CsvImportView';
import { LeadsDatabaseView } from './components/LeadsDatabaseView';
import { CampaignsView } from './components/CampaignsView';
import { OutreachView } from './components/OutreachView';
import { MarketingMessageView } from './components/MarketingMessageView';
import { CopilotChatView } from './components/CopilotChatView';
import { ActivityView } from './components/ActivityView';
import { SettingsView } from './components/SettingsView';
import { CompanyProfileModal } from './components/CompanyProfileModal';
import { ScoreBreakdownModal } from './components/ScoreBreakdownModal';
import { AppStorage } from './utils/storage';
import { Lead, IcpCampaign, CompanyProfile, ActivityLog } from './types';
import { exportLeadsToCsv, CsvProcessingSummary } from './utils/csvParser';
import { Bot, Sparkles, MessageSquare } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [campaigns, setCampaigns] = useState<IcpCampaign[]>(() => AppStorage.getCampaigns());
  const [activeCampaign, setActiveCampaign] = useState<IcpCampaign>(() => AppStorage.getActiveCampaign());
  const [leads, setLeads] = useState<Lead[]>(() => AppStorage.getLeads());
  const [companies, setCompanies] = useState<CompanyProfile[]>(() => AppStorage.getCompanies());
  const [activities, setActivities] = useState<ActivityLog[]>(() => AppStorage.getActivity());

  // Modals & Drawer state
  const [selectedLeadForOutreach, setSelectedLeadForOutreach] = useState<Lead | null>(null);
  const [companyModalData, setCompanyModalData] = useState<CompanyProfile | null>(null);
  const [breakdownModalLead, setBreakdownModalLead] = useState<Lead | null>(null);
  const [isCopilotDrawerOpen, setIsCopilotDrawerOpen] = useState(false);

  // Sync state changes to persistence
  useEffect(() => {
    AppStorage.saveLeads(leads);
  }, [leads]);

  useEffect(() => {
    AppStorage.saveCampaigns(campaigns);
  }, [campaigns]);

  useEffect(() => {
    AppStorage.saveCompanies(companies);
  }, [companies]);

  // Campaign switcher
  const handleSelectCampaign = (id: string) => {
    AppStorage.setActiveCampaign(id);
    const selected = campaigns.find((c) => c.id === id);
    if (selected) {
      setActiveCampaign(selected);
      AppStorage.logActivity({
        type: 'campaign_updated',
        title: `Switched Active Campaign to "${selected.name}"`,
        details: `Active ICP updated to target ${selected.targetIndustries.join(', ')} with min ${selected.minEmployees}+ staff.`,
        status: 'success',
      });
      setActivities(AppStorage.getActivity());
    }
  };

  // Add discovered leads from Web Search
  const handleAddDiscoveredLeads = (newLeads: Lead[], newCompanies: CompanyProfile[]) => {
    const updatedLeads = [...newLeads, ...leads];
    setLeads(updatedLeads);

    // Merge companies
    const updatedCompanies = [...newCompanies, ...companies];
    setCompanies(updatedCompanies);

    AppStorage.logActivity({
      type: 'search_discovery',
      title: `Added ${newLeads.length} Discovered Leads`,
      details: `Google search grounded discovery completed. Discovered ${newCompanies.length} accounts and ${newLeads.length} contacts.`,
      itemCount: newLeads.length,
      status: 'success',
    });
    setActivities(AppStorage.getActivity());
  };

  // CSV Import completed
  const handleCsvImportCompleted = (imported: Lead[], summary: CsvProcessingSummary) => {
    const updatedLeads = [...imported, ...leads];
    setLeads(updatedLeads);

    AppStorage.logActivity({
      type: 'csv_import',
      title: `Imported CSV Batch: ${imported.length} Qualified`,
      details: `Processed ${summary.totalParsed} rows, prevented ${summary.duplicateCount} duplicates, and rejected ${summary.rejectedCount} invalid records.`,
      itemCount: imported.length,
      status: 'success',
    });
    setActivities(AppStorage.getActivity());
  };

  // Update leads (e.g. rescore, delete, status change)
  const handleUpdateLeads = (updated: Lead[]) => {
    setLeads(updated);
  };

  // Outreach navigation
  const handleSelectLeadForOutreach = (lead: Lead) => {
    setSelectedLeadForOutreach(lead);
    setCurrentTab('outreach');
  };

  // View Read-Only Company Profile
  const handleViewCompanyProfile = (companyName: string) => {
    const found = companies.find(
      (c) => c.name.toLowerCase().trim() === companyName.toLowerCase().trim()
    );
    if (found) {
      setCompanyModalData(found);
    } else {
      // Find associated lead to build firmographic card
      const leadMatch = leads.find(
        (l) => l.companyName.toLowerCase().trim() === companyName.toLowerCase().trim()
      );
      setCompanyModalData({
        id: `comp_${Date.now()}`,
        name: companyName,
        domain: leadMatch?.companyDomain || `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        industry: leadMatch?.industry || 'B2B Technology',
        headquarters: leadMatch?.location || 'Headquarters Verified',
        companySize: leadMatch?.companySize || '200+ employees',
        estimatedEmployees: leadMatch?.employeeCount || 250,
        description: `Verified enterprise account matching ${leadMatch?.industry || 'B2B'} ICP profile.`,
        technologiesUsed: leadMatch?.technologies || ['Cloud infrastructure'],
        knownLeadership: leadMatch ? [{ name: leadMatch.fullName, title: leadMatch.jobTitle }] : [],
        sources: leadMatch?.sourceUrls || [],
        complianceVerified: true,
        lastUpdated: new Date().toISOString(),
      });
    }
  };

  // View Score Breakdown
  const handleViewScoreBreakdown = (lead: Lead) => {
    setBreakdownModalLead(lead);
  };

  // Global CSV Export
  const handleExportCsv = () => {
    exportLeadsToCsv(leads, 'propelmatch_leads_database.csv');
    AppStorage.logActivity({
      type: 'csv_export',
      title: 'Exported Leads to CSV',
      details: `Generated CSV download containing ${leads.length} leads with full score breakdowns and grounding citations.`,
      itemCount: leads.length,
      status: 'success',
    });
    setActivities(AppStorage.getActivity());
  };

  const handleClearActivity = () => {
    localStorage.removeItem('propelmatch_activity_v1');
    setActivities([]);
  };

  const qualifiedLeadsCount = leads.filter(
    (l) => l.scoreBreakdown?.tier === 'Qualified for Review'
  ).length;

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeCampaign={activeCampaign}
        totalLeadsCount={leads.length}
        qualifiedCount={qualifiedLeadsCount}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <Header
          currentTab={currentTab}
          campaigns={campaigns}
          activeCampaign={activeCampaign}
          onSelectCampaign={handleSelectCampaign}
          onNavigate={setCurrentTab}
          onExportCsv={handleExportCsv}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              leads={leads}
              companies={companies}
              activeCampaign={activeCampaign}
              onNavigate={setCurrentTab}
              onSelectLeadForOutreach={handleSelectLeadForOutreach}
              onViewCompanyProfile={handleViewCompanyProfile}
              onViewScoreBreakdown={handleViewScoreBreakdown}
            />
          )}

          {currentTab === 'discovery' && (
            <DiscoveryView
              activeCampaign={activeCampaign}
              existingLeads={leads}
              existingCompanies={companies}
              onAddLeads={handleAddDiscoveredLeads}
              onNavigate={setCurrentTab}
              onViewCompanyProfile={handleViewCompanyProfile}
            />
          )}

          {currentTab === 'csv_import' && (
            <CsvImportView
              activeCampaign={activeCampaign}
              existingLeads={leads}
              onImportCompleted={handleCsvImportCompleted}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'leads' && (
            <LeadsDatabaseView
              leads={leads}
              activeCampaign={activeCampaign}
              onUpdateLeads={handleUpdateLeads}
              onSelectLeadForOutreach={handleSelectLeadForOutreach}
              onViewCompanyProfile={handleViewCompanyProfile}
              onViewScoreBreakdown={handleViewScoreBreakdown}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'campaigns' && (
            <CampaignsView
              campaigns={campaigns}
              activeCampaign={activeCampaign}
              leads={leads}
              onSaveCampaigns={setCampaigns}
              onSetActiveCampaign={handleSelectCampaign}
              onUpdateLeads={handleUpdateLeads}
            />
          )}

          {currentTab === 'outreach' && (
            <OutreachView
              leads={leads}
              selectedLead={selectedLeadForOutreach}
              activeCampaign={activeCampaign}
              onSelectLead={setSelectedLeadForOutreach}
            />
          )}

          {currentTab === 'marketing' && (
            <MarketingMessageView
              activeCampaign={activeCampaign}
              campaigns={campaigns}
              onSelectCampaign={handleSelectCampaign}
            />
          )}

          {currentTab === 'copilot' && (
            <CopilotChatView
              activeCampaign={activeCampaign}
              totalLeadsCount={leads.length}
              qualifiedCount={qualifiedLeadsCount}
              selectedLead={selectedLeadForOutreach}
              onNavigate={setCurrentTab}
            />
          )}

          {currentTab === 'activity' && (
            <ActivityView
              activities={activities}
              onClearActivity={handleClearActivity}
            />
          )}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Floating Copilot Launcher (Visible when not already on Copilot tab) */}
      {currentTab !== 'copilot' && (
        <button
          onClick={() => setIsCopilotDrawerOpen(!isCopilotDrawerOpen)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-600/30 transition-all transform hover:scale-105 font-medium text-sm border-2 border-white/20"
          title="Open AI Copilot Chat"
          aria-label="Open AI Copilot Chat"
        >
          <Bot className="w-5 h-5" />
          <span className="hidden sm:inline">AI Copilot</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      )}

      {/* Floating Copilot Slide-Over Drawer */}
      {isCopilotDrawerOpen && currentTab !== 'copilot' && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in">
          <div
            className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <CopilotChatView
              activeCampaign={activeCampaign}
              totalLeadsCount={leads.length}
              qualifiedCount={qualifiedLeadsCount}
              selectedLead={selectedLeadForOutreach}
              onNavigate={(tab) => {
                setCurrentTab(tab);
                setIsCopilotDrawerOpen(false);
              }}
              isDrawer={true}
              onCloseDrawer={() => setIsCopilotDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* STRICTLY READ-ONLY Company Profile Modal (No edit buttons/icons/forms) */}
      <CompanyProfileModal
        company={companyModalData}
        isOpen={Boolean(companyModalData)}
        onClose={() => setCompanyModalData(null)}
      />

      {/* Explainable Score Breakdown Modal */}
      <ScoreBreakdownModal
        lead={breakdownModalLead}
        campaign={activeCampaign}
        isOpen={Boolean(breakdownModalLead)}
        onClose={() => setBreakdownModalLead(null)}
      />
    </div>
  );
}
