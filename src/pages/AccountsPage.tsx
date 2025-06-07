import React, { useState, useEffect } from 'react';
import { useAccount } from '../contexts/AccountContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Plus, Users, Settings, Mail, UserX, Crown, Shield, Edit, Eye } from 'lucide-react';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const AccountsPage: React.FC = () => {
  const {
    accounts,
    currentAccount,
    accountMembers,
    accountInvites,
    isLoading,
    error,
    setCurrentAccount,
    createAccount,
    fetchAccountMembers,
    fetchAccountInvites,
    inviteMember,
    removeMember,
    cancelInvite,
  } = useAccount();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    type: 'team',
    description: '',
  });
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    email: '',
    role: 'viewer',
  });

  useEffect(() => {
    if (currentAccount) {
      fetchAccountMembers(currentAccount.id);
      fetchAccountInvites(currentAccount.id);
    }
  }, [currentAccount]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newAccount = await createAccount(createFormData);
      setCurrentAccount(newAccount);
      setShowCreateForm(false);
      setCreateFormData({ name: '', type: 'team', description: '' });
    } catch (err) {
      console.error('Failed to create account:', err);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccount) return;

    try {
      await inviteMember(currentAccount.id, inviteFormData.email, inviteFormData.role);
      setShowInviteForm(false);
      setInviteFormData({ email: '', role: 'viewer' });
    } catch (err) {
      console.error('Failed to invite member:', err);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4" />;
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'editor':
        return <Edit className="h-4 w-4" />;
      case 'viewer':
        return <Eye className="h-4 w-4" />;
      default:
        return <Eye className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      case 'editor':
        return 'outline';
      case 'viewer':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (isLoading && accounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Account Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your accounts, members, and permissions
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Account
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 border border-destructive text-destructive px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Account Selection */}
      <div className="mb-6">
        <Label htmlFor="account-select" className="text-sm font-medium mb-2 block">
          Select Account
        </Label>
        <select
          id="account-select"
          value={currentAccount?.id || ''}
          onChange={(e) => {
            const account = accounts.find(a => a.id === e.target.value);
            setCurrentAccount(account || null);
          }}
          className="w-full px-3 py-2 border border-border rounded-md bg-background"
        >
          <option value="">Select an account...</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({account.type})
            </option>
          ))}
        </select>
      </div>

      {/* Create Account Form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Account</CardTitle>
            <CardDescription>
              Create a new account to organize your team and content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <Label htmlFor="account-name">Account Name</Label>
                <Input
                  id="account-name"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter account name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="account-type">Account Type</Label>
                <select
                  id="account-type"
                  value={createFormData.type}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="family">Family (up to 6 members)</option>
                  <option value="team">Team (up to 25 members)</option>
                  <option value="enterprise">Enterprise (unlimited members)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="account-description">Description (Optional)</Label>
                <Input
                  id="account-description"
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter account description"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <LoadingSpinner /> : 'Create Account'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Account Details */}
      {currentAccount && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">
              <Users className="h-4 w-4 mr-2" />
              Members
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {currentAccount.name}
                  <Badge variant="secondary" className="capitalize">
                    {currentAccount.type}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {currentAccount.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-accent/50 rounded-lg">
                    <div className="text-2xl font-bold">{accountMembers.length}</div>
                    <div className="text-sm text-muted-foreground">Members</div>
                  </div>
                  <div className="text-center p-4 bg-accent/50 rounded-lg">
                    <div className="text-2xl font-bold">{accountInvites.length}</div>
                    <div className="text-sm text-muted-foreground">Pending Invites</div>
                  </div>
                  <div className="text-center p-4 bg-accent/50 rounded-lg">
                    <div className="text-2xl font-bold capitalize">{currentAccount.userRole}</div>
                    <div className="text-sm text-muted-foreground">Your Role</div>
                  </div>
                  <div className="text-center p-4 bg-accent/50 rounded-lg">
                    <div className="text-2xl font-bold">
                      {currentAccount.typeInfo?.maxMembers === -1 ? '∞' : currentAccount.typeInfo?.maxMembers}
                    </div>
                    <div className="text-sm text-muted-foreground">Max Members</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members">
            <div className="space-y-6">
              {currentAccount.userRole === 'owner' || currentAccount.userRole === 'admin' ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Invite Member</CardTitle>
                    <CardDescription>
                      Invite new members to join this account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {showInviteForm ? (
                      <form onSubmit={handleInviteMember} className="space-y-4">
                        <div>
                          <Label htmlFor="invite-email">Email Address</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            value={inviteFormData.email}
                            onChange={(e) => setInviteFormData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="Enter email address"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="invite-role">Role</Label>
                          <select
                            id="invite-role"
                            value={inviteFormData.role}
                            onChange={(e) => setInviteFormData(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? <LoadingSpinner /> : 'Send Invite'}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setShowInviteForm(false)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <Button onClick={() => setShowInviteForm(true)}>
                        <Mail className="h-4 w-4 mr-2" />
                        Invite Member
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : null}

              {/* Current Members */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Members</CardTitle>
                  <CardDescription>
                    Manage existing account members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {accountMembers.map((member) => (
                      <div key={member.userId} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            {member.user?.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-medium">
                              {member.user?.firstName} {member.user?.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {member.user?.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getRoleBadgeVariant(member.role)} className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </Badge>
                          {member.role !== 'owner' && (currentAccount.userRole === 'owner' || currentAccount.userRole === 'admin') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeMember(currentAccount.id, member.userId)}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pending Invites */}
              {accountInvites.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Invites</CardTitle>
                    <CardDescription>
                      Manage pending member invitations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {accountInvites.map((invite) => (
                        <div key={invite.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div>
                            <div className="font-medium">{invite.email}</div>
                            <div className="text-sm text-muted-foreground">
                              Invited as {invite.role} • Expires {new Date(invite.expiresAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Pending</Badge>
                            {(currentAccount.userRole === 'owner' || currentAccount.userRole === 'admin') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => cancelInvite(currentAccount.id, invite.id)}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage account configuration and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Account Name</Label>
                    <Input value={currentAccount.name} readOnly />
                  </div>
                  <div>
                    <Label>Account Type</Label>
                    <Input value={currentAccount.type} readOnly className="capitalize" />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input value={currentAccount.description || 'No description'} readOnly />
                  </div>
                  <div>
                    <Label>Created</Label>
                    <Input value={new Date(currentAccount.createdAt).toLocaleDateString()} readOnly />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AccountsPage;
