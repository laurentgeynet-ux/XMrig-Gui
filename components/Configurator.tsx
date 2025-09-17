import React, { useState } from 'react';
import type { XMRigConfig } from '../types';
import { ALGORITHMS, COINS, DEFAULT_CONFIG } from '../constants';
import Input from './common/Input';
import Select from './common/Select';
import Toggle from './common/Toggle';
import Button from './common/Button';
import Card from './common/Card';
import TooltipIcon from './common/TooltipIcon';

interface ConfiguratorProps {
  config: XMRigConfig;
  setConfig: React.Dispatch<React.SetStateAction<XMRigConfig>>;
  onStart: () => void;
}

const Configurator: React.FC<ConfiguratorProps> = ({ config, setConfig, onStart }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoGpu, setAutoGpu] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Pool & Wallet validation
    if (!config.poolUrl) {
      newErrors.poolUrl = "L'URL du pool est requise.";
    } else if (!/^([^:]+):(\d+)$/.test(config.poolUrl)) {
      newErrors.poolUrl = "Le format doit être host:port.";
    }
    if (!config.walletAddress) {
      newErrors.walletAddress = "L'adresse du portefeuille est requise.";
    }

    // Algorithm & Coin validation
    if (!config.algorithm || !ALGORITHMS.includes(config.algorithm)) {
      newErrors.algorithm = "Veuillez sélectionner un algorithme valide.";
    }
    if (!config.coin || !COINS.includes(config.coin)) {
      newErrors.coin = "Veuillez sélectionner une monnaie valide.";
    }

    // Threads validation
    if (config.threads !== null && (isNaN(config.threads) || config.threads <= 0)) {
      newErrors.threads = "Le nombre de threads doit être un entier positif.";
    }

    // Donate Level validation
    if (config.donateLevel === null || isNaN(config.donateLevel) || config.donateLevel < 1 || config.donateLevel > 99) {
      newErrors.donateLevel = "Doit être entre 1 et 99.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // Clear error for the field being edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setConfig(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
        const numValue = value === '' ? null : parseInt(value, 10);
        setConfig(prev => ({ ...prev, [name]: isNaN(numValue as number) ? null : numValue }));
    } else {
      setConfig(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDonateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (errors.donateLevel) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.donateLevel;
        return newErrors;
      });
    }
    const valueAsNumber = parseInt(e.target.value, 10);
    setConfig(prev => ({ ...prev, donateLevel: isNaN(valueAsNumber) ? 1 : valueAsNumber }));
  };

  const handleAutoGpuToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isEnabled = e.target.checked;
    setAutoGpu(isEnabled);
    if (isEnabled) {
      setConfig(prev => ({
        ...prev,
        algorithm: 'cn/gpu',
        coin: 'zephyr',
        threads: null,
      }));
      setErrors(prev => {
          const newErrors = {...prev};
          delete newErrors.algorithm;
          delete newErrors.coin;
          delete newErrors.threads;
          return newErrors;
      });
    } else {
      setConfig(prev => ({
        ...prev,
        algorithm: DEFAULT_CONFIG.algorithm,
        coin: DEFAULT_CONFIG.coin,
        threads: DEFAULT_CONFIG.threads,
      }));
    }
  };

  const handleAutoDetectThreads = () => {
    if (navigator.hardwareConcurrency) {
      setConfig(prev => ({ ...prev, threads: navigator.hardwareConcurrency }));
      if (errors.threads) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.threads;
          return newErrors;
        });
      }
    } else {
      alert("La détection automatique du CPU n'est pas supportée par votre navigateur.");
    }
  };
  
  const isStartDisabled = !config.poolUrl || !config.walletAddress || Object.keys(errors).length > 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validate()) {
      onStart();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Configuration Principale" icon="fa-server">
            <Input
              label="URL du Pool de Minage (host:port)"
              name="poolUrl"
              value={config.poolUrl}
              onChange={handleChange}
              placeholder="pool.supportxmr.com:443"
              required
              tooltip="L'adresse et le port de votre pool de minage."
              error={errors.poolUrl}
            />
            <Input
              label="Adresse de votre portefeuille"
              name="walletAddress"
              value={config.walletAddress}
              onChange={handleChange}
              placeholder="Votre adresse Monero, Zephyr, etc."
              required
              tooltip="L'adresse de votre portefeuille où les récompenses seront envoyées."
              error={errors.walletAddress}
            />
            <Input
              label="Mot de passe du Pool"
              name="password"
              value={config.password}
              onChange={handleChange}
              placeholder="x (ou le mot de passe de votre worker)"
              tooltip="Généralement 'x' ou le nom de votre worker."
            />
          </Card>
        </div>
        <div>
          <Card title="Algorithme & Monnaie" icon="fa-microchip">
            <Select
              label="Algorithme"
              name="algorithm"
              value={config.algorithm}
              onChange={handleChange}
              options={ALGORITHMS.map(algo => ({ value: algo, label: algo.toUpperCase() }))}
              tooltip="L'algorithme de minage à utiliser. Assurez-vous qu'il est compatible avec votre monnaie."
              error={errors.algorithm}
              disabled={autoGpu}
            />
            <Select
              label="Monnaie"
              name="coin"
              value={config.coin}
              onChange={handleChange}
              options={COINS.map(coin => ({ value: coin, label: coin.charAt(0).toUpperCase() + coin.slice(1) }))}
              tooltip="Spécifier la monnaie aide le mineur à optimiser certains paramètres."
              error={errors.coin}
              disabled={autoGpu}
            />
          </Card>
        </div>
      </div>

      <Card title="Paramètres Avancés" icon="fa-cogs">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 items-start">
           <Input
            label="Threads CPU"
            name="threads"
            type="number"
            value={config.threads ?? ''}
            onChange={handleChange}
            placeholder="Auto"
            min="1"
            tooltip="Nombre de threads CPU à utiliser. Laissez vide pour une détection automatique."
            error={errors.threads}
            disabled={autoGpu}
            buttonIcon="fa-microchip"
            onButtonClick={handleAutoDetectThreads}
          />
          <div>
            <div className="flex items-center mb-2">
              <label htmlFor="donateLevel" className="block text-sm font-medium text-slate-400">
                  Niveau de Donation (%)
              </label>
              <TooltipIcon text="Pourcentage du temps de minage à donner aux développeurs de XMRig (min 1%)." />
            </div>
            <div className="flex items-center space-x-2">
                <input
                    type="range"
                    id="donateLevelRange"
                    name="donateLevel"
                    min="1"
                    max="99"
                    value={config.donateLevel}
                    onChange={handleDonateChange}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <Input
                    name="donateLevel"
                    type="number"
                    value={config.donateLevel}
                    onChange={handleDonateChange}
                    className="w-20 text-center py-1"
                    min="1"
                    max="99"
                    id="donateLevel"
                    error={errors.donateLevel}
                />
            </div>
          </div>
          <Input
            label="Fichier de Log"
            name="logFile"
            value={config.logFile}
            onChange={handleChange}
            placeholder="/path/to/xmrig.log"
            tooltip="Chemin vers un fichier pour enregistrer la sortie du mineur."
          />
          <div className="flex items-center pt-6 space-x-8">
             <Toggle
              label="Activer TLS/SSL"
              name="tls"
              checked={config.tls}
              onChange={handleChange}
              tooltip="Utiliser une connexion sécurisée au pool."
            />
            <Toggle
              label="Mode Arrière-plan"
              name="background"
              checked={config.background}
              onChange={handleChange}
              tooltip="Lancer le mineur en tant que processus d'arrière-plan."
            />
          </div>
           <div className="flex items-center pt-6 space-x-8 md:col-start-2">
             <Toggle
              label="Paramètres GPU Auto"
              name="autoGpu"
              checked={autoGpu}
              onChange={handleAutoGpuToggle}
              tooltip="Configure automatiquement les paramètres pour le minage GPU (cn/gpu, zephyr)."
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-center pt-6">
        <Button type="submit" disabled={isStartDisabled}>
            Lancer le Minage <i className="fas fa-rocket ml-2"></i>
        </Button>
      </div>
    </form>
  );
};

export default Configurator;