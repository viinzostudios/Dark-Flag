import { Component, OnInit, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const pw  = control.get('newPassword')?.value;
  const pwc = control.get('confirmPassword')?.value;
  return pw && pwc && pw !== pwc ? { mismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslateModule],
  template: `
    <div class="page">
      <div class="bg">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="grid"></div>
      </div>

      <a class="back-btn" routerLink="/auth/login">{{ 'auth.back' | translate }}</a>

      <div class="card">
        <h2 class="card-title">{{ 'auth.reset_title' | translate }}</h2>

        @if (!token()) {
          <div class="error-box">
            <p class="err-msg">{{ 'auth.reset_invalid_token' | translate }}</p>
            <a class="btn-back" routerLink="/auth/forgot-password">{{ 'auth.reset_request_new' | translate }}</a>
          </div>
        } @else if (!done()) {
          <p class="card-sub">{{ 'auth.reset_sub' | translate }}</p>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="field">
              <label>{{ 'auth.reset_new_pass' | translate }}</label>
              <input type="password" formControlName="newPassword"
                     placeholder="••••••••" autocomplete="new-password" />
              @if (form.get('newPassword')?.invalid && form.get('newPassword')?.touched) {
                <span class="err">{{ 'auth.password_min' | translate }}</span>
              }
            </div>

            <div class="field">
              <label>{{ 'auth.reset_confirm_pass' | translate }}</label>
              <input type="password" formControlName="confirmPassword"
                     placeholder="••••••••" autocomplete="new-password" />
              @if (form.hasError('mismatch') && form.get('confirmPassword')?.touched) {
                <span class="err">{{ 'auth.reset_mismatch' | translate }}</span>
              }
            </div>

            @if (errorMsg()) {
              <div class="err global">{{ errorMsg() }}</div>
            }

            <button type="submit" class="btn-submit" [disabled]="form.invalid || loading()">
              {{ loading() ? ('auth.reset_loading' | translate) : ('auth.reset_save' | translate) }}
            </button>
          </form>
        } @else {
          <div class="success-box">
            <div class="success-icon">✅</div>
            <p class="success-msg">{{ 'auth.reset_updated' | translate }}</p>
            <a class="btn-back" routerLink="/auth/login">{{ 'auth.reset_go_login' | translate }}</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .page {
      position: relative; width: 100vw; height: 100vh;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .bg { position: absolute; inset: 0; background: var(--t-bg); }
    .blob { position: absolute; border-radius: 50%; filter: blur(90px); will-change: transform; }
    .b1 {
      width: 55vw; height: 55vw; max-width: 700px; max-height: 700px;
      background: var(--t-b1);
      opacity: var(--t-b1-op); top: -15%; left: -10%;
      animation: drift 20s ease-in-out infinite alternate;
    }
    .b2 {
      width: 50vw; height: 50vw; max-width: 650px; max-height: 650px;
      background: var(--t-b2);
      opacity: var(--t-b2-op); bottom: -15%; right: -10%;
      animation: drift 26s ease-in-out infinite alternate-reverse;
    }
    .grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(var(--t-grid) 1px, transparent 1px),
        linear-gradient(90deg, var(--t-grid) 1px, transparent 1px);
      background-size: 60px 60px;
    }
    @keyframes drift {
      from { transform: translate(0,0) scale(1); }
      to   { transform: translate(40px,40px) scale(1.08); }
    }

    .back-btn {
      position: absolute; top: 24px; left: 28px; z-index: 20;
      color: var(--t-back); font-size: 14px; font-weight: 600;
      text-decoration: none; letter-spacing: .02em; transition: color .15s;
    }
    .back-btn:hover { color: var(--t-back-h); }

    .card {
      position: relative; z-index: 10;
      background: rgba(11,17,32,.92); backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(14,165,233,.15);
      border-top: 2px solid rgba(14,165,233,.35);
      border-radius: 6px;
      padding: clamp(28px,5vw,48px); width: min(420px,90vw);
      color: var(--t-tx);
      box-shadow: 0 8px 40px rgba(0,0,0,.70), 0 0 1px rgba(14,165,233,.15);
    }

    .card-title {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: clamp(24px,3.2vw,34px); font-weight: 900;
      letter-spacing: 2px; text-transform: uppercase;
      margin: 0 0 6px; color: #f0f9ff;
    }
    .card-sub { font-size: 14px; color: var(--t-tx4); margin: 0 0 24px; }

    .field { margin-bottom: 18px; }
    label {
      display: block; font-size: 12px; font-weight: 600;
      color: var(--t-tx3); letter-spacing: .06em; text-transform: uppercase; margin-bottom: 8px;
    }
    input {
      width: 100%; padding: 12px 16px;
      background: var(--t-input-bg); border: 1px solid var(--t-bd2);
      border-radius: 10px; color: var(--t-tx); font-size: 15px; font-family: inherit;
      box-sizing: border-box; transition: border-color .15s,background .15s;
    }
    input::placeholder { color: var(--t-placeholder); }
    input:focus { outline: none; border-color: var(--t-focus-bd); background: var(--t-focus-bg); }

    .err { color: var(--t-err); font-size: 12px; margin-top: 5px; display: block; }
    .err.global { margin-bottom: 14px; text-align: center; }

    .btn-submit {
      width: 100%; padding: 14px;
      background: linear-gradient(135deg, var(--t-flag-dk, #d97706), var(--t-flag));
      border: none; border-radius: 4px;
      color: #060912;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 17px; font-weight: 900;
      letter-spacing: 3px; text-transform: uppercase;
      cursor: pointer;
      box-shadow: 0 0 28px var(--t-flag-glow); transition: transform .15s,box-shadow .15s;
    }
    .btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 0 52px var(--t-flag-glow2, rgba(245,158,11,.75)); }
    .btn-submit:disabled { opacity: .5; cursor: not-allowed; }

    .success-box, .error-box {
      display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 8px 0;
    }
    .success-icon { font-size: 48px; }
    .success-msg, .err-msg {
      text-align: center; font-size: 14px; color: var(--t-tx2); margin: 0; line-height: 1.6;
    }
    .btn-back {
      color: var(--t-accent); text-decoration: none; font-size: 13px; font-weight: 600; margin-top: 4px;
    }
    .btn-back:hover { text-decoration: underline; }

    @media (max-width: 768px) {
      .page { height: auto; min-height: 100vh; overflow-y: auto; align-items: flex-start; padding: 64px 0 40px; }
      .back-btn { top: 16px; left: 16px; font-size: 13px; }
      .card { margin: auto; }
    }
  `],
})
export class ResetPasswordComponent implements OnInit {
  readonly token    = signal('');
  readonly done     = signal(false);
  readonly loading  = signal(false);
  readonly errorMsg = signal('');

  private readonly translate = inject(TranslateService);

  form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly http: HttpClient,
  ) {
    this.form = this.fb.group({
      newPassword:     ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    }, { validators: passwordsMatch });
  }

  ngOnInit(): void {
    const t = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.token.set(t);
  }

  submit(): void {
    if (this.form.invalid || !this.token()) return;
    this.loading.set(true);
    this.errorMsg.set('');

    this.http.post(`${environment.apiUrl}/auth/reset-password`, {
      token: this.token(),
      newPassword: this.form.value.newPassword,
    }).subscribe({
      next: () => { this.done.set(true); this.loading.set(false); },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.message ?? this.translate.instant('auth.reset_invalid_token'));
      },
    });
  }
}
