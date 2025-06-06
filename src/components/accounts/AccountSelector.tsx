import React from 'react';
import { Check, ChevronDown, Users, Building2, Home, Briefcase } from 'lucide-react';
import { useAccount } from '../../contexts/AccountContext';
import { Account } from '../../types';

const AccountSelector: React.FC = () => {
  const { accounts, currentAccount, setCurrentAccount } = useAccount();
  const [isOpen, setIsOpen] = React.useState(false);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'personal':
        return <Home className="h-4 w-4" />;
      case 'family':
        return <Users className="h-4 w-4" />;
      case 'team':
        return <Briefcase className="h-4 w-4" />;
      case 'enterprise':
        return <Building2 className="h-4 w-4" />;
      default:
        return <Home className="h-4 w-4" />;
    }
  };

  const handleAccountSelect = (account: Account) => {
    setCurrentAccount(account);
    setIsOpen(false);
  };

  if (accounts.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-background border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors min-w-[200px]"
      >
        <div className="flex items-center gap-2 flex-1">
          {currentAccount && getAccountIcon(currentAccount.type)}
          <span className="truncate">
            {currentAccount?.name || 'Select Account'}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-full bg-popover border border-border rounded-md shadow-md z-20 max-h-60 overflow-auto">
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => handleAccountSelect(account)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
              >
                <div className="flex items-center gap-2 flex-1">
                  {getAccountIcon(account.type)}
                  <div className="flex flex-col">
                    <span className="truncate">{account.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {account.type} • {account.userRole}
                    </span>
                  </div>
                </div>
                {currentAccount?.id === account.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AccountSelector;
