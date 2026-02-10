import { useEffect, useRef, useState } from 'react';

import WindowTopBar from '../../components/WindowTopBar';
import AccountSection from './Account';
import GeneralSection from './General';
import BackupsSection from './Backups';
import Header from './Header';
import { DeviceProvider } from '../../context/DeviceContext';
import { BackupProvider } from '../../context/BackupContext';
import BackupFolderSelector from './Backups/Selector/BackupFolderSelector';
import { isTypeSection, Section } from './Utils/section.types';
import { CleanerSection } from './Cleaner/cleaner-section';
import { CleanerProvider } from '../../context/CleanerContext';

export default function Settings() {
  const [activeSection, setActiveSection] = useState<Section>('GENERAL');
  const [subsection, setSubsection] = useState<'panel' | 'list' | 'download_list'>('panel');

  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(([rootElement]) =>
      window.electron.settingsWindowResized({
        width: rootElement.borderBoxSize[0].inlineSize,
        height: rootElement.borderBoxSize[0].blockSize,
      }),
    );

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    resizeObserver.observe(rootRef.current!);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const section = url.searchParams.get('section');
    if (section && isTypeSection(section)) {
      setActiveSection(section);
    }
  }, []);

  return (
    <DeviceProvider>
      <BackupProvider>
        <CleanerProvider>
          <div
            ref={rootRef}
            style={{
              minWidth: 600,
              minHeight: subsection === 'list' ? 0 : 420,
            }}>
            {subsection === 'list' && activeSection === 'BACKUPS' && (
              <BackupFolderSelector onClose={() => setSubsection('panel')} />
            )}
            {subsection === 'panel' && (
              <div className="flex flex-grow flex-col">
                <WindowTopBar title="Internxt" className="bg-surface dark:bg-gray-5" />
                <Header active={activeSection} onClick={setActiveSection} />
                <div className="flex bg-gray-1 p-5" style={{ minHeight: 420 }}>
                  <GeneralSection active={activeSection === 'GENERAL'} data-automation-id="itemSettingsGeneral" />
                  <AccountSection active={activeSection === 'ACCOUNT'} data-automation-id="itemSettingsAccount" />
                  <BackupsSection
                    active={activeSection === 'BACKUPS'}
                    showBackedFolders={() => setSubsection('list')}
                    showIssues={() => window.electron.openProcessIssuesWindow()}
                    data-automation-id="itemSettingsBackups"
                  />
                  <CleanerSection active={activeSection === 'CLEANER'} data-automation-id="itemSettingsCleaner" />
                </div>
              </div>
            )}
          </div>
        </CleanerProvider>
      </BackupProvider>
    </DeviceProvider>
  );
}
