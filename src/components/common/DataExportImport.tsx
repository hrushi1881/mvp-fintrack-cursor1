import React, { useState } from 'react';
import { Download, Upload, FileText, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';
import { useFinance } from '../../contexts/FinanceContext';

export const DataExportImport: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const { exportData, importData } = useFinance();

  const handleExport = async () => {
    try {
      setStatus('loading');
      const data = await exportData(exportFormat);
      
      const blob = new Blob([data], { 
        type: exportFormat === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finspire-data-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setStatus('success');
      setMessage('Data exported successfully!');
    } catch (error) {
      setStatus('error');
      setMessage('Failed to export data. Please try again.');
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    try {
      setStatus('loading');
      const text = await importFile.text();
      const format = importFile.name.endsWith('.csv') ? 'csv' : 'json';
      
      await importData(text, format);
      
      setStatus('success');
      setMessage('Data imported successfully!');
      setImportFile(null);
    } catch (error) {
      setStatus('error');
      setMessage('Failed to import data. Please check the file format.');
    }
  };

  const resetStatus = () => {
    setStatus('idle');
    setMessage('');
  };

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        variant="outline"
        size="sm"
        className="flex items-center space-x-2"
      >
        <Database size={16} />
        <span>Data</span>
      </Button>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetStatus();
        }}
        title="Data Management"
      >
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setActiveTab('export');
                resetStatus();
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'export'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Download size={16} className="inline mr-2" />
              Export
            </button>
            <button
              onClick={() => {
                setActiveTab('import');
                resetStatus();
              }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'import'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Upload size={16} className="inline mr-2" />
              Import
            </button>
          </div>

          {/* Status Message */}
          {status !== 'idle' && (
            <div className={`p-4 rounded-lg border ${
              status === 'success' 
                ? 'bg-success-50 border-success-200' 
                : status === 'error'
                ? 'bg-error-50 border-error-200'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center space-x-2">
                {status === 'loading' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                )}
                {status === 'success' && <CheckCircle size={16} className="text-success-500" />}
                {status === 'error' && <AlertCircle size={16} className="text-error-500" />}
                <p className={`text-sm font-medium ${
                  status === 'success' 
                    ? 'text-success-700' 
                    : status === 'error'
                    ? 'text-error-700'
                    : 'text-blue-700'
                }`}>
                  {message}
                </p>
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Your Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Download all your financial data for backup or migration purposes.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      value="json"
                      checked={exportFormat === 'json'}
                      onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                      className="sr-only"
                    />
                    <div className={`p-3 rounded-lg border-2 transition-colors ${
                      exportFormat === 'json'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <FileText size={20} className="mx-auto mb-2 text-gray-600" />
                      <p className="text-sm font-medium text-center">JSON</p>
                      <p className="text-xs text-gray-500 text-center">Complete data</p>
                    </div>
                  </label>
                  
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                      className="sr-only"
                    />
                    <div className={`p-3 rounded-lg border-2 transition-colors ${
                      exportFormat === 'csv'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <Database size={20} className="mx-auto mb-2 text-gray-600" />
                      <p className="text-sm font-medium text-center">CSV</p>
                      <p className="text-xs text-gray-500 text-center">Transactions only</p>
                    </div>
                  </label>
                </div>
              </div>

              <Button
                onClick={handleExport}
                className="w-full"
                loading={status === 'loading'}
                disabled={status === 'loading'}
              >
                <Download size={16} className="mr-2" />
                Export Data
              </Button>
            </div>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a previously exported file to restore your data.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".json,.csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="import-file"
                  />
                  <label htmlFor="import-file" className="cursor-pointer">
                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {importFile ? importFile.name : 'Click to select a file'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports JSON and CSV files
                    </p>
                  </label>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle size={16} className="text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-yellow-700 font-medium">Important</p>
                    <p className="text-yellow-600">
                      Importing data will add to your existing data. It won't replace it.
                      Make sure to backup your current data first.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleImport}
                className="w-full"
                disabled={!importFile || status === 'loading'}
                loading={status === 'loading'}
              >
                <Upload size={16} className="mr-2" />
                Import Data
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};