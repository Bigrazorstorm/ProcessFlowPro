import { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, GitMerge, Building2, Calendar, Clock } from 'lucide-react';
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
import { Progress } from '../components/ui/progress';

interface Workflow {
  id: string;
  name: string;
  clientName: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  progress: number;
  dueDate: string;
  updatedAt: string;
}

export default function Workflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // TODO: Fetch from API
    setWorkflows([
      {
        id: '1',
        name: 'Jahresabschluss 2023',
        clientName: 'Müller GmbH',
        status: 'in_progress',
        progress: 65,
        dueDate: '2024-06-30',
        updatedAt: '2024-03-15T10:30:00Z',
      },
      {
        id: '2',
        name: 'Einkommensteuer 2023',
        clientName: 'Schmidt & Co. KG',
        status: 'not_started',
        progress: 0,
        dueDate: '2024-07-31',
        updatedAt: '2024-03-10T14:20:00Z',
      },
      {
        id: '3',
        name: 'Lohnabrechnung März',
        clientName: 'Weber IT Solutions',
        status: 'completed',
        progress: 100,
        dueDate: '2024-03-25',
        updatedAt: '2024-03-20T09:15:00Z',
      },
      {
        id: '4',
        name: 'Umsatzsteuervoranmeldung Q1',
        clientName: 'Müller GmbH',
        status: 'blocked',
        progress: 30,
        dueDate: '2024-04-10',
        updatedAt: '2024-03-18T16:45:00Z',
      },
    ]);
  }, []);

  const filteredWorkflows = workflows.filter(workflow => 
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'not_started':
        return <Badge variant="secondary">Nicht gestartet</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">In Bearbeitung</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Abgeschlossen</Badge>;
      case 'blocked':
        return <Badge variant="destructive">Blockiert</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground mt-1">
            Verwalten und überwachen Sie alle laufenden Prozesse.
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Neuer Workflow
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Aktive Workflows</CardTitle>
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
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Mandant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fortschritt</TableHead>
                  <TableHead>Fällig am</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorkflows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Keine Workflows gefunden.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWorkflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <GitMerge className="w-4 h-4 text-muted-foreground" />
                          {workflow.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="w-4 h-4" />
                          {workflow.clientName}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(workflow.status)}
                      </TableCell>
                      <TableCell className="w-[200px]">
                        <div className="flex items-center gap-2">
                          <Progress value={workflow.progress} className="h-2" />
                          <span className="text-xs text-muted-foreground w-8 text-right">
                            {workflow.progress}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(workflow.dueDate).toLocaleDateString('de-DE')}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            Aktualisiert: {new Date(workflow.updatedAt).toLocaleDateString('de-DE')}
                          </div>
                        </div>
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
                            <DropdownMenuItem>Öffnen</DropdownMenuItem>
                            <DropdownMenuItem>Bearbeiten</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              Archivieren
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
    </div>
  );
}
