import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Building2, Users, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useClients, Client, CreateClientDto, UpdateClientDto } from '../hooks/useClients';
import ClientModal from '../components/ClientModal';

export default function Clients() {
  const { clients, loading, error, createClient, updateClient, deleteClient } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.industry || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && client.isActive) ||
      (filterStatus === 'inactive' && !client.isActive);
    return matchesSearch && matchesStatus;
  });

  const handleCreate = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleSave = async (data: CreateClientDto | UpdateClientDto) => {
    if (selectedClient) {
      await updateClient(selectedClient.id, data as UpdateClientDto);
    } else {
      await createClient(data as CreateClientDto);
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    try {
      await deleteClient(id);
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mandanten</h1>
          <p className="text-muted-foreground mt-1">
            Verwalten Sie hier Ihre Mandanten und deren Kontaktdaten.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Neuer Mandant
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>
              Alle Mandanten{' '}
              <span className="text-muted-foreground font-normal text-base">
                ({filteredClients.length})
              </span>
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex rounded-md border overflow-hidden">
                {(['all', 'active', 'inactive'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      filterStatus === status
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {status === 'all' ? 'Alle' : status === 'active' ? 'Aktiv' : 'Inaktiv'}
                  </button>
                ))}
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Suchen..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Branche</TableHead>
                  <TableHead>Mitarbeiter</TableHead>
                  <TableHead>Zuverlässigkeit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hinzugefügt am</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Keine Mandanten gefunden.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          {client.name}
                        </div>
                        {client.specialties && client.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {client.specialties.slice(0, 2).map((s) => (
                              <span key={s} className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                {s}
                              </span>
                            ))}
                            {client.specialties.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{client.specialties.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.industry || '–'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span className="text-sm">{client.employeeCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-sm">{client.reliabilityFactor.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.isActive ? 'default' : 'secondary'}>
                          {client.isActive ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(client.createdAt).toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Menü öffnen</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(client)}>
                              Bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(client.id)}
                            >
                              {deleteConfirm === client.id ? 'Bestätigen?' : 'Löschen'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedClient(null);
        }}
        onSave={handleSave}
        client={selectedClient}
      />
    </div>
  );
}
