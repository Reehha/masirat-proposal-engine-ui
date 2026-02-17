import { Component, EventEmitter, Output, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProjectService } from '../../../services/project';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-proposal-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './proposal-form.html',
  styleUrls: ['./proposal-form.css'],
})
export class ProposalFormComponent implements OnInit {
  @Output() valueChange = new EventEmitter<any>();
  @Output() exportPdfRequested = new EventEmitter<void>();

  form!: FormGroup;
  
  // Track the currently loaded proposal ID for updates
  currentProposalId: string | null = null;
  
  // Modal properties
  showProposalModal = false;
  proposals: any[] = [];
  filteredProposals: any[] = [];
  searchTerm: string = '';
  loading = false;
  initialLoadDone = false;
  
  // Delete confirmation
  showDeleteConfirm = false;
  proposalToDelete: any = null;
  deleteInProgress = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 3;
  totalPages = 1;
  totalItems = 0;

  monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  years = [2025, 2026, 2027, 2028];

  // ===== Editors =====
  objectiveEditor!: FormGroup;
  clientReqEditor!: FormGroup;
  packageEditor!: FormGroup;

  editingObjectiveIndex: number | null = null;
  editingClientReqIndex: number | null = null;
  editingPackageIndex: number | null = null;

  constructor(
    private fb: FormBuilder, 
    private projectService: ProjectService, 
    private ngZone: NgZone
  ) {
    this.initializeForm();
    this.initializeEditors();
    
    // Emit live changes for preview
    this.form.valueChanges.subscribe(value => {
      this.valueChange.emit(value);
    });
  }

  ngOnInit() {
    // Pre-load projects when component initializes
    this.preLoadProjects();
  }

  preLoadProjects() {
    this.loading = true;
    this.projectService.getProposals().subscribe({
      next: (response: any) => {
        this.ngZone.run(() => {
          if (Array.isArray(response)) {
            this.proposals = [...response];
          } else if (response && response.data && Array.isArray(response.data)) {
            this.proposals = [...response.data];
          } else {
            this.proposals = [];
            console.warn('Unexpected response format:', response);
          }

          console.log('Proposals pre-loaded:', this.proposals.length);
          
          this.totalItems = this.proposals.length;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          
          this.currentPage = 1;
          this.applyFilterAndPagination();
          this.loading = false;
          this.initialLoadDone = true;
        });
      },
      error: (err) => {
        console.error('Error pre-loading proposals:', err);
        this.ngZone.run(() => {
          this.loading = false;
          this.proposals = [];
          this.filteredProposals = [];
          this.initialLoadDone = true;
        });
      }
    });
  }

  initializeForm() {
    this.form = this.fb.group({
      timeline: this.fb.group({
        projectName: ['', [Validators.required, Validators.minLength(3)]],
        introduction: [''],
        months: this.fb.array(this.buildConsecutiveMonths()),
      }),

      requirements: this.fb.group({
        objectives: this.fb.array([]),
        clientRequirements: this.fb.array([]),
      }),

      pricing: this.fb.group({
        packages: this.fb.array([]),
      }),
    });
  }

  initializeEditors() {
    this.objectiveEditor = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
    });

    this.clientReqEditor = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
    });

    this.packageEditor = this.fb.group({
      name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      recommended: [false],
      featuresText: [''],
    });
  }

  // ===== Modal Methods =====
  openProposalModal() {
    this.showProposalModal = true;
    this.currentPage = 1;
    this.searchTerm = '';
    
    // If we already have proposals, just filter them
    if (this.proposals.length > 0) {
      this.applyFilterAndPagination();
    } else if (!this.loading) {
      // Only fetch if we don't have data and not already loading
      this.fetchProposals();
    }
  }

  closeProposalModal() {
    this.showProposalModal = false;
    // Also close delete confirmation if open
    this.showDeleteConfirm = false;
    this.proposalToDelete = null;
  }

  // Prevent modal from closing when clicking inside
  onModalContentClick(event: MouseEvent) {
    event.stopPropagation();
  }

  fetchProposals() {
    this.ngZone.run(() => {
      this.loading = true;
    });

    this.projectService.getProposals().subscribe({
      next: (response: any) => {
        console.log('GET /projects response:', response);
        
        this.ngZone.run(() => {
          if (Array.isArray(response)) {
            this.proposals = [...response];
          } else if (response && response.data && Array.isArray(response.data)) {
            this.proposals = [...response.data];
          } else {
            this.proposals = [];
            console.warn('Unexpected response format:', response);
          }

          console.log('Proposals set:', this.proposals.length);
          
          this.totalItems = this.proposals.length;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          
          this.currentPage = 1;
          this.applyFilterAndPagination();
          this.loading = false;
        });
      },
      error: (err) => {
        console.error('Error fetching proposals:', err);
        this.ngZone.run(() => {
          alert('Failed to load proposals');
          this.loading = false;
          this.proposals = [];
          this.filteredProposals = [];
        });
      }
    });
  }
 
  applyFilterAndPagination() {
    let filtered = [...this.proposals];

    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = this.proposals.filter(p =>
        (p.pname || '').toLowerCase().includes(term)
      );
    }

    this.totalItems = filtered.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.pageSize));

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.filteredProposals = [...filtered.slice(start, end)];

    console.log('Filtered proposals:', this.filteredProposals.length);
  }
  
  searchProposals() {
    this.currentPage = 1;
    this.applyFilterAndPagination();
  }
  
  changePage(page: number) {
    this.currentPage = page;
    this.applyFilterAndPagination();
  }

  // Reset the form for a new proposal
  resetForm() {
    // Clear current proposal ID
    this.currentProposalId = null;
    
    // Clear all form arrays
    while (this.objectives.length) this.objectives.removeAt(0);
    while (this.clientRequirements.length) this.clientRequirements.removeAt(0);
    while (this.packages.length) this.packages.removeAt(0);
    
    // Reset timeline months to default
    const monthsArray = this.form.get('timeline.months') as FormArray;
    while (monthsArray.length) monthsArray.removeAt(0);
    this.buildConsecutiveMonths().forEach(group => {
      monthsArray.push(group);
    });
    
    // Reset form fields
    this.form.get('timeline.projectName')?.setValue('');
    this.form.get('timeline.introduction')?.setValue('');
    
    // Reset editors
    this.cancelObjectiveEdit();
    this.cancelClientReqEdit();
    this.cancelPackageEdit();
    
    console.log('Form reset for new proposal');
  }

  loadProposal(proposal: any) {
    // Immediately close the modal for better UX
    this.closeProposalModal();
    
    // Show loading indicator in the form (optional)
    this.loading = true;
    
    this.projectService.getProposalById(proposal.pid).subscribe({
      next: (fullProposal) => {
        this.ngZone.run(() => {
          console.log('Loading full proposal:', fullProposal);
          
          // Store the current proposal ID for updates
          this.currentProposalId = proposal.pid || fullProposal.pid;
          
          this.populateFormWithProposal(fullProposal);
          this.loading = false;
          
          console.log('Proposal loaded successfully with ID:', this.currentProposalId);
        });
      },
      error: (err) => {
        console.error('Error loading proposal:', err);
        this.ngZone.run(() => {
          alert('Failed to load proposal details');
          this.loading = false;
        });
      }
    });
  }

  // ===== Delete Confirmation Methods =====
  confirmDelete(proposal: any, event: MouseEvent) {
    event.stopPropagation(); // Prevent triggering the parent click (loadProposal)
    this.proposalToDelete = proposal;
    this.showDeleteConfirm = true;
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.proposalToDelete = null;
  }

  deleteProposal() {
    if (!this.proposalToDelete) return;
    
    this.deleteInProgress = true;
    
    this.projectService.deleteProposal(this.proposalToDelete.pid).subscribe({
      next: (response) => {
        console.log('Delete successful:', response);
        
        this.ngZone.run(() => {
          // Remove the deleted proposal from the local array
          this.proposals = this.proposals.filter(p => p.pid !== this.proposalToDelete.pid);
          
          // Re-apply filtering and pagination
          this.applyFilterAndPagination();
          
          // If the deleted proposal was the currently loaded one, reset the form
          if (this.currentProposalId === this.proposalToDelete.pid) {
            this.resetForm();
          }
          
          // Close confirmation
          this.showDeleteConfirm = false;
          this.proposalToDelete = null;
          this.deleteInProgress = false;
          
          // Show success message
          alert('Proposal deleted successfully!');
        });
      },
      error: (err) => {
        console.error('Error deleting proposal:', err);
        this.ngZone.run(() => {
          alert('Failed to delete proposal. Please try again.');
          this.deleteInProgress = false;
        });
      }
    });
  }

  trackByPid(index: number, proposal: any): string {
    return proposal.pid || index;
  }

  populateFormWithProposal(proposal: any) {
    // Clear existing arrays
    while (this.objectives.length) this.objectives.removeAt(0);
    while (this.clientRequirements.length) this.clientRequirements.removeAt(0);
    while (this.packages.length) this.packages.removeAt(0);
  
    // Set basic fields
    this.form.get('timeline.projectName')?.setValue(proposal.pname || '');
    this.form.get('timeline.introduction')?.setValue(proposal.introduction || '');
  
    // Handle timeline
    if (proposal.timelineJson) {
      try {
        const months = typeof proposal.timelineJson === 'string' 
          ? JSON.parse(proposal.timelineJson) 
          : proposal.timelineJson;
        
        const monthsArray = this.form.get('timeline.months') as FormArray;
  
        while (monthsArray.length) monthsArray.removeAt(0);
  
        if (Array.isArray(months) && months.length > 0) {
          months.forEach((m: any) => {
            monthsArray.push(
              this.fb.group({
                month: [m.month || m.monthName || '', Validators.required],
                year: [m.year || new Date().getFullYear(), Validators.required],
                description: [m.desc || m.description || '', Validators.required],
              })
            );
          });
        } else {
          this.buildConsecutiveMonths().forEach(group => {
            monthsArray.push(group);
          });
        }
      } catch (e) {
        console.error('Error parsing timelineJson:', e);
        const monthsArray = this.form.get('timeline.months') as FormArray;
        while (monthsArray.length) monthsArray.removeAt(0);
        this.buildConsecutiveMonths().forEach(group => {
          monthsArray.push(group);
        });
      }
    } else {
      const monthsArray = this.form.get('timeline.months') as FormArray;
      while (monthsArray.length) monthsArray.removeAt(0);
      this.buildConsecutiveMonths().forEach(group => {
        monthsArray.push(group);
      });
    }
  
    // Handle services/objectives
    const services = proposal.services || proposal.objectives || [];
    if (Array.isArray(services)) {
      services.forEach((obj: any) => {
        this.objectives.push(
          this.fb.group({
            title: [obj.title || '', Validators.required],
            description: [obj.desc || obj.description || '', Validators.required],
          })
        );
      });
    }
  
    // Handle client requirements
    const clientReqs = proposal.clientReq || proposal.clientRequirements || [];
    if (Array.isArray(clientReqs)) {
      clientReqs.forEach((req: any) => {
        this.clientRequirements.push(
          this.fb.group({
            title: [req.title || '', Validators.required],
            description: [req.desc || req.description || '', Validators.required],
          })
        );
      });
    }
  
    // Handle pricing packages
    const pricingPlans = proposal.pricingPlans || proposal.packages || [];
    if (Array.isArray(pricingPlans)) {
      pricingPlans.forEach((pkg: any) => {
        const features = pkg.features || [];
        const featuresArray = this.fb.array(
          features.map((f: string) => this.fb.control(f))
        );
  
        this.packages.push(
          this.fb.group({
            name: [pkg.name || '', Validators.required],
            price: [pkg.price || 0, [Validators.required, Validators.min(0)]],
            recommended: [pkg.recommended || false],
            features: featuresArray,
          })
        );
      });
    }
  
    // Emit the updated value
    this.valueChange.emit(this.form.value);
    
    this.form.markAsTouched();
  }
  
  // ===== Validation helpers =====
  get isFormValid() {
    return this.form.valid;
  }

  get isObjectiveValid() {
    return this.objectiveEditor.valid;
  }

  get isClientReqValid() {
    return this.clientReqEditor.valid;
  }

  get isPackageValid() {
    return this.packageEditor.valid;
  }

  requestExportPdf() {
    if (this.form.valid) {
      this.exportPdfRequested.emit();
    }
  }

  buildConsecutiveMonths() {
    const arr = [];
    const start = new Date();

    for (let i = 0; i < 6; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);

      arr.push(
        this.fb.group({
          month: [this.monthNames[d.getMonth()], Validators.required],
          year: [d.getFullYear(), Validators.required],
          description: ['', Validators.required],
        })
      );
    }

    return arr;
  }

  // ===== Getters =====
  get months() {
    return this.form.get('timeline.months') as FormArray;
  }

  get objectives() {
    return this.form.get('requirements.objectives') as FormArray;
  }

  get clientRequirements() {
    return this.form.get('requirements.clientRequirements') as FormArray;
  }

  get packages() {
    return this.form.get('pricing.packages') as FormArray;
  }

  // ===== Objectives =====
  saveObjective() {
    if (this.objectiveEditor.invalid) return;

    if (this.editingObjectiveIndex === null) {
      this.objectives.push(this.fb.group(this.objectiveEditor.value));
    } else {
      this.objectives.at(this.editingObjectiveIndex)?.patchValue(this.objectiveEditor.value);
    }

    this.cancelObjectiveEdit();
  }

  editObjective(i: number) {
    this.objectiveEditor.patchValue(this.objectives.at(i).value);
    this.editingObjectiveIndex = i;
  }

  deleteObjective(i: number) {
    this.objectives.removeAt(i);
    if (this.editingObjectiveIndex === i) this.cancelObjectiveEdit();
  }

  cancelObjectiveEdit() {
    this.objectiveEditor.reset();
    this.editingObjectiveIndex = null;
  }

  // ===== Client Requirements =====
  saveClientReq() {
    if (this.clientReqEditor.invalid) return;

    if (this.editingClientReqIndex === null) {
      this.clientRequirements.push(this.fb.group(this.clientReqEditor.value));
    } else {
      this.clientRequirements.at(this.editingClientReqIndex)?.patchValue(this.clientReqEditor.value);
    }

    this.cancelClientReqEdit();
  }

  editClientReq(i: number) {
    this.clientReqEditor.patchValue(this.clientRequirements.at(i).value);
    this.editingClientReqIndex = i;
  }

  deleteClientReq(i: number) {
    this.clientRequirements.removeAt(i);
    if (this.editingClientReqIndex === i) this.cancelClientReqEdit();
  }

  cancelClientReqEdit() {
    this.clientReqEditor.reset();
    this.editingClientReqIndex = null;
  }

  // ===== Packages =====
  savePackage() {
    if (this.packageEditor.invalid) return;

    const features = (this.packageEditor.value.featuresText || '')
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    const pkgGroup = this.fb.group({
      name: [this.packageEditor.value.name],
      price: [this.packageEditor.value.price],
      recommended: [this.packageEditor.value.recommended],
      features: this.fb.array(features.map((f: string) => this.fb.control(f))),
    });

    if (this.editingPackageIndex === null) {
      this.packages.push(pkgGroup);
    } else {
      this.packages.setControl(this.editingPackageIndex, pkgGroup);
    }

    this.cancelPackageEdit();
  }

  editPackage(i: number) {
    const p = this.packages.at(i).value;
    this.packageEditor.patchValue({
      name: p.name,
      price: p.price,
      recommended: p.recommended,
      featuresText: (p.features || []).join(', '),
    });
    this.editingPackageIndex = i;
  }

  deletePackage(i: number) {
    this.packages.removeAt(i);
    if (this.editingPackageIndex === i) this.cancelPackageEdit();
  }

  cancelPackageEdit() {
    this.packageEditor.reset({ price: 0, recommended: false, featuresText: '' });
    this.editingPackageIndex = null;
  }

  // submit method now handles both create and update
  submit() {
    if (this.form.invalid) {
      console.warn('Form invalid', this.form.value);
      this.form.markAllAsTouched();
      return;
    }
  
    const invalidPlan = this.packages.controls.find((p: any) => {
      const features = (p.value.features || []).filter((f: string) => String(f).trim().length > 0);
      return features.length === 0;
    });
    
    if (invalidPlan) {
      alert('Each pricing plan must have at least one feature.');
      return;
    }
  
    const monthsArr = this.months.controls.map((c: any) => ({
      month: c.value.month,
      year: Number(c.value.year),
      desc: c.value.description,
    }));
  
    const payload = {
      pname: this.form.get('timeline.projectName')?.value,
      timelineJson: JSON.stringify(monthsArr, null, 2),
      clientReq: this.clientRequirements.controls.map((r: any) => ({
        title: r.value.title,
        desc: r.value.description,
      })),
      services: this.objectives.controls.map((o: any) => ({
        title: o.value.title,
        desc: o.value.description,
      })),
      pricingPlans: this.packages.controls.map((p: any) => {
        const features = (p.value.features || [])
          .map((f: string) => String(f).trim())
          .filter(Boolean);
      
        return {
          name: p.value.name,
          price: String(p.value.price),
          recommended: !!p.value.recommended,
          features: features,
        };
      }),      
    };
  
    console.log('Submitting payload:', payload);
    console.log('Current proposal ID:', this.currentProposalId);
  
    // Check if we're updating an existing proposal or creating a new one
    if (this.currentProposalId) {
      // UPDATE existing proposal
      this.projectService.updateProject(this.currentProposalId, payload).subscribe({
        next: (res) => {
          console.log('Update successful:', res);
          alert('Proposal updated successfully!');
          
          // Refresh the proposals list to show updated data
          this.preLoadProjects();
        },
        error: (err) => {
          console.error('Update error:', err);
          alert('Failed to update proposal. Check console/network.');
        },
      });
    } else {
      // CREATE new proposal
      this.projectService.createProject(payload).subscribe({
        next: (res) => {
          console.log('Create successful:', res);
          alert('Proposal created successfully!');
          
          // Refresh the proposals list
          this.preLoadProjects();
          
          // Optionally, set the current proposal ID to the newly created one
          if (res && res.pid) {
            this.currentProposalId = res.pid;
          }
        },
        error: (err) => {
          console.error('Create error:', err);
          alert('Failed to create proposal. Check console/network.');
        },
      });
    }
  }
}