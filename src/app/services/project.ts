import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProjectRequest {
  pname: string;
  timelineJson: string;
  clientReq: { title: string; desc: string }[];
  services: { title: string; desc: string }[];
  pricingPlans: {
    name: string;
    price: string;
    recommended: boolean;
    features: string[];
  }[];
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly STORAGE_KEY = 'masirat_auth'; // where you store token

  constructor(private http: HttpClient) {}

  // 🔐 Build headers with token (no AuthService involved)
  private authHeaders() {
    const raw = localStorage.getItem(this.STORAGE_KEY);

    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const token = parsed.token;

        if (token) {
          headers = headers.set('Authorization', `Bearer ${token}`);
        }
      } catch {
        // ignore parse errors
      }
    }

    return { headers };
  }

  // ➕ Create new project
  createProject(payload: ProjectRequest): Observable<any> {
    return this.http.post(
      `${this.baseUrl}/projects`,
      payload,
      this.authHeaders()
    );
  }

  // ✏️ Update project
  updateProject(pid: string, payload: ProjectRequest): Observable<any> {
    return this.http.put(
      `${this.baseUrl}/projects/${pid}`,
      payload,
      this.authHeaders()
    );
  }

  // 📄 Get project by id
  getProject(pid: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/projects/${pid}`,
      this.authHeaders()
    );
  }

  // In your project.service.ts, add these methods:
  // 📄 Get ALL projects
getProposals(): Observable<any[]> {
  return this.http.get<any[]>(
    `${this.baseUrl}/projects`,
    this.authHeaders()
  );
}

// 📄 Get single project by pid
getProposalById(pid: string): Observable<any> {
  return this.http.get<any>(
    `${this.baseUrl}/projects/${pid}`,
    this.authHeaders()
  );
}

deleteProposal(id: string): Observable<any> {
  return this.http.delete(
    `${this.baseUrl}/projects/${id}`,
    this.authHeaders()
  );
}

}
