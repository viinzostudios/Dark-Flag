import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
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
        <h2 class="card-title">{{ 'auth.forgot_title' | translate }}</h2>

        @if (!sent()) {
          <p class="card-sub">{{ 'auth.forgot_sub' | translate }}</p>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="field">
              <label>{{ 'auth.email' | translate }}</label>
              <input type="email" formControlName="email"
                     [placeholder]="'auth.email_placeholder' | translate" autocomplete="email" />
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <span class="err">{{ 'auth.email_invalid' | translate }}</span>
              }
            </div>

            @if (errorMsg()) {
              <div class="err global">{{ errorMsg() }}</div>
            }

            <button type="submit" class="btn-submit" [disabled]="form.invalid || loading()">
              {{ loading() ? ('auth.forgot_loading' | translate) : ('auth.forgot_submit' | translate) }}
            </button>
          </form>
        } @else {
          <div class="success-box">
            <div class="success-icon">📧</div>
            <p class="success-msg">{{ 'auth.forgot_sent_msg' | translate }}</p>
            <p class="success-hint">{{ 'auth.forgot_sent_spam' | translate }}</p>
            <a class="btn-back" routerLink="/auth/login">{{ 'auth.forgot_back_login' | translate }}</a>
          </div>
        }

        <p class="link-row">{{ 'auth.forgot_remembered' | translate }} <a routerLink="/auth/login">{{ 'auth.forgot_login_link' | translate }}</a></p>
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
      background: var(--t-surface2); backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--t-bd); border-radius: 24px;
      padding: clamp(28px,5vw,48px); width: min(420px,90vw);
      color: var(--t-tx); box-shadow: var(--t-card-shadow);
    }

    .card-title {
      font-size: clamp(20px,3vw,28px); font-weight: 800; margin: 0 0 6px;
      background: var(--t-logo-grad);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
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
      background: linear-gradient(135deg, var(--t-accent-dk), var(--t-accent));
      border: none; border-radius: 12px;
      color: var(--t-on-accent); font-size: 16px; font-weight: 800; cursor: pointer;
      font-family: inherit; letter-spacing: .04em;
      box-shadow: 0 0 30px var(--t-accent-glow); transition: transform .15s,box-shadow .15s;
    }
    .btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 0 50px var(--t-accent-glow2); }
    .btn-submit:disabled { opacity: .5; cursor: not-allowed; }

    .success-box { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 8px 0; }
    .success-icon { font-size: 48px; }
    .success-msg { text-align: center; font-size: 14px; color: var(--t-tx2); margin: 0; line-height: 1.6; }
    .success-hint { font-size: 12px; color: var(--t-dim); margin: 0; text-align: center; }
    .btn-back {
      color: var(--t-accent); text-decoration: none; font-size: 13px; font-weight: 600;
      margin-top: 4px;
    }
    .btn-back:hover { text-decoration: underline; }

    .link-row { text-align: center; color: var(--t-tx5); font-size: 13px; margin: 16px 0 0; }
    .link-row a { color: var(--t-accent); text-decoration: none; font-weight: 600; }

    @media (max-width: 768px) {
      .page { height: auto; min-height: 100vh; overflow-y: auto; align-items: flex-start; padding: 64px 0 40px; }
      .back-btn { top: 16px; left: 16px; font-size: 13px; }
      .card { margin: auto; }
    }
    .link-row a:hover { text-decoration: underline; }
  `],
})
export class ForgotPasswordComponent {
  readonly sent     = signal(false);
  readonly loading  = signal(false);
  readonly errorMsg = signal('');

  form;

  constructor(
    private readonly fb: FormBuilder,
    private readonly http: HttpClient,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');

    this.http.post(`${environment.apiUrl}/auth/forgot-password`, {
      email: this.form.value.email,
    }).subscribe({
      next: () => { this.sent.set(true); this.loading.set(false); },
      error: () => {
        // Always show success to avoid email enumeration
        this.sent.set(true);
        this.loading.set(false);
      },
    });
  }
}
