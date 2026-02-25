import { useState } from 'react';
import { Plus, Search, MoreHorizontal, FileText, Copy, Edit2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import {
  useTemplates,
  WorkflowTemplate,
  CreateTemplateDto,
  UpdateTemplateDto,
} from '../hooks/useTemplates';
import TemplateModal from '../components/TemplateModal';

export default function Templates() {
  const navigate = useNavigate();
  const { templates, loading, error, createTemplate, updateTemplate, deleteTemplate } =
    useTemplates();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.industry || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setSelectedTemplate(null);
    setIsModalOpen(true);
  };

  const handleEdit = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const handleSave = async (data: CreateTemplateDto | UpdateTemplateDto) => {
    if (selectedTemplate) {
      await updateTemplate(selectedTemplate.id, data as UpdateTemplateDto);
    } else {
      const created = await createTemplate(data as CreateTemplateDto);
      // Navigate to editor after creating
      navigate(`/templates/${created.id}`);
      return;
    }
  };

  const handleDuplicate = async (template: WorkflowTemplate) => {
    try {
      await createTemplate({
        name: `${template.name} (Kopie)`,
        industry: template.industry,
        description: template.description,
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    try {
      await deleteTemplate(id);
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
          <h1 className="text-3xl font-bold tracking-tight">Workflow Templates</h1>
          <p className="text-muted-foreground mt-1">
            Erstellen und verwalten Sie Vorlagen für wiederkehrende Prozesse.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Neues Template
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>
              Alle Templates{' '}
              <span className="text-muted-foreground font-normal text-base">
                ({filteredTemplates.length})
              </span>
            </CardTitle>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Branche</TableHead>
                  <TableHead>Schritte</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Zuletzt aktualisiert</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Keine Templates gefunden.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 font-medium">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            {template.name}
                          </div>
                          {template.description && (
                            <span className="text-sm text-muted-foreground line-clamp-1">
                              {template.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {template.industry ? (
                          <Badge variant="outline">{template.industry}</Badge>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {template.steps?.length ?? 0}
                          </span>
                          <span className="text-sm">Schritte</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.isActive ? 'default' : 'secondary'}>
                          {template.isActive ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(template.updatedAt).toLocaleDateString('de-DE')}
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
                            <DropdownMenuItem
                              onClick={() => navigate(`/templates/${template.id}`)}
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Steps bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(template)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Grunddaten bearbeiten
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Duplizieren
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(template.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {deleteConfirm === template.id ? 'Bestätigen?' : 'Löschen'}
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

      <TemplateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTemplate(null);
        }}
        onSave={handleSave}
        template={selectedTemplate}
      />
    </div>
  );
}
