import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { SideAdComponent } from '../../shared/components/side-ad.component';
import { LangSelectorComponent } from '../../shared/components/lang-selector.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SideAdComponent, TranslateModule, LangSelectorComponent],
  template: `
    <div class="page">
      <div class="bg">
        <div class="blob b1"></div>
        <div class="blob b2"></div>
        <div class="blob b3"></div>
        <div class="grid"></div>
      </div>

      <div class="back-row">
        <a class="back-btn" routerLink="/">{{ 'auth.back' | translate }}</a>
        <app-lang-selector variant="nav" />
      </div>

      <div class="auth-inner">
        <div class="auth-side-col"><app-side-ad /></div>
        <div class="card">
        <div class="card-head">
          <h2 class="card-title">{{ 'auth.register_title' | translate }}</h2>
          <p class="card-sub">{{ 'auth.register_sub' | translate }}</p>
        </div>

        <form class="card-form" [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label>{{ 'auth.email' | translate }}</label>
            <input type="email" formControlName="email"
                   [placeholder]="'auth.email_placeholder' | translate" autocomplete="email" />
            <span class="err" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">
              {{ 'auth.email_invalid' | translate }}
            </span>
          </div>

          <div class="field">
            <label>{{ 'auth.register_username' | translate }}</label>
            <input type="text" formControlName="username"
                   [placeholder]="'auth.register_username_placeholder' | translate" autocomplete="username" />
            <span class="err" *ngIf="form.get('username')?.invalid && form.get('username')?.touched">
              {{ 'auth.register_username_invalid' | translate }}
            </span>
          </div>

          <div class="field">
            <label>{{ 'auth.password' | translate }}</label>
            <input type="password" formControlName="password"
                   [placeholder]="'auth.password_placeholder' | translate" autocomplete="new-password" />
            <span class="err" *ngIf="form.get('password')?.invalid && form.get('password')?.touched">
              {{ 'auth.password_min' | translate }}
            </span>
          </div>

          <div class="err global" *ngIf="errorMsg">{{ errorMsg }}</div>

          <button type="submit" class="btn-submit" [disabled]="form.invalid || loading">
            {{ loading ? ('auth.register_loading' | translate) : ('auth.register_submit' | translate) }}
          </button>
        </form>

        <div class="card-links">
          <p class="link-row">{{ 'auth.register_has_account' | translate }} <a routerLink="/auth/login">{{ 'auth.register_login_link' | translate }}</a></p>
        </div>
        </div>
        <div class="auth-side-col"><app-side-ad /></div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .page {
      position: relative;
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
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
    .b3 {
      width: 40vw; height: 40vw; max-width: 500px; max-height: 500px;
      background: var(--t-b3);
      opacity: var(--t-b3-op); top: 30%; left: 35%;
      animation: drift 17s ease-in-out infinite alternate;
    }
    .grid {
      position: absolute; inset: 0;
      background-image:
        linear-gradient(var(--t-grid) 1px, transparent 1px),
        linear-gradient(90deg, var(--t-grid) 1px, transparent 1px);
      background-size: 60px 60px;
    }
    @keyframes drift {
      from { transform: translate(0, 0) scale(1); }
      to   { transform: translate(40px, 40px) scale(1.08); }
    }

    .back-row {
      position: absolute;
      top: 20px; left: 28px; right: 28px;
      z-index: 20;
      display: flex; align-items: center; justify-content: space-between;
    }
    .back-btn {
      z-index: 20;
      color: var(--t-back);
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      letter-spacing: .02em;
      transition: color .15s;
    }
    .back-btn:hover { color: var(--t-back-h); }

    .auth-inner {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      position: relative;
      z-index: 1;
    }
    .auth-side-col {
      display: none;
      flex: 1;
      align-items: center;
      justify-content: center;
    }
    @media (min-width: 1420px) {
      .auth-side-col { display: flex; }
    }

    .card {
      position: relative;
      z-index: 10;
      background: rgba(11,17,32,.92);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(14,165,233,.15);
      border-top: 2px solid rgba(14,165,233,.35);
      border-radius: 6px;
      padding: clamp(24px, 4vw, 40px);
      width: min(420px, 90vw);
      color: var(--t-tx);
      box-shadow: 0 8px 40px rgba(0,0,0,.70), 0 0 1px rgba(14,165,233,.15);
    }

    .card-title {
      font-family: 'Barlow Condensed', sans-serif;
      font-size: clamp(26px, 3.5vw, 36px);
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 0 0 6px;
      color: #f0f9ff;
    }
    .card-head { margin-bottom: 20px; }

    .card-sub {
      font-size: 14px;
      color: var(--t-tx4);
      margin: 0;
    }

    .field { margin-bottom: 16px; }
    label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--t-tx3);
      letter-spacing: .06em;
      text-transform: uppercase;
      margin-bottom: 7px;
    }
    input {
      width: 100%;
      padding: 11px 16px;
      background: var(--t-input-bg);
      border: 1px solid var(--t-bd2);
      border-radius: 10px;
      color: var(--t-tx);
      font-size: 15px;
      font-family: inherit;
      box-sizing: border-box;
      transition: border-color .15s, background .15s;
    }
    input::placeholder { color: var(--t-placeholder); }
    input:focus {
      outline: none;
      border-color: var(--t-focus-bd);
      background: var(--t-focus-bg);
    }

    .err { color: var(--t-err); font-size: 12px; margin-top: 5px; display: block; }
    .err.global { margin-bottom: 12px; text-align: center; }

    .btn-submit {
      width: 100%;
      padding: 14px;
      margin-top: 4px;
      background: linear-gradient(135deg, var(--t-flag-dk, #d97706), var(--t-flag));
      border: none;
      border-radius: 4px;
      color: #060912;
      font-family: 'Barlow Condensed', sans-serif;
      font-size: 17px;
      font-weight: 900;
      letter-spacing: 3px;
      text-transform: uppercase;
      cursor: pointer;
      box-shadow: 0 0 28px var(--t-flag-glow);
      transition: transform .15s, box-shadow .15s;
    }
    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 0 52px var(--t-flag-glow2, rgba(245,158,11,.75));
    }
    .btn-submit:disabled { opacity: .5; cursor: not-allowed; }

    .link-row {
      text-align: center;
      color: var(--t-tx5);
      font-size: 13px;
      margin: 16px 0 0;
    }
    .link-row a { color: var(--t-accent); text-decoration: none; font-weight: 600; }
    .link-row a:hover { text-decoration: underline; }

    @media (max-width: 768px) {
      .page {
        height: auto; min-height: 100vh;
        overflow-y: auto;
        align-items: flex-start;
        padding: 64px 0 40px;
      }
      .back-btn { top: 16px; left: 16px; font-size: 13px; }
      .card { margin: auto; }
    }

    /* Móvil landscape: 2 columnas, sin scroll */
    @media (max-height: 450px) and (orientation: landscape) {
      .page { height: 100vh; overflow: hidden; padding: 0; align-items: center; }
      .back-btn { top: 8px; left: 12px; font-size: 11px; }

      .card {
        display: grid;
        grid-template-columns: 160px 1fr;
        grid-template-rows: auto 1fr;
        grid-template-areas: "hd fc" "lk fc";
        gap: 0 20px;
        width: min(680px, 92vw);
        padding: 12px 18px;
        border-radius: 16px;
        align-items: start;
      }
      .card-head  { grid-area: hd; margin-bottom: 0; border-right: 1px solid var(--t-bd); padding-right: 14px; }
      .card-form  { grid-area: fc; }
      .card-links { grid-area: lk; align-self: end; border-right: 1px solid var(--t-bd); padding-right: 14px; }

      .card-title { font-size: 16px; margin-bottom: 4px; }
      .card-sub   { font-size: 11px; margin-bottom: 0; line-height: 1.4; }

      .field { margin-bottom: 7px; }
      label  { font-size: 10px; margin-bottom: 2px; }
      input  { padding: 6px 10px; font-size: 13px; border-radius: 8px; }
      .btn-submit { padding: 8px; font-size: 13px; margin-top: 2px; }

      .link-row { margin-top: 8px; font-size: 11px; }
    }
  `]
})
export class RegisterComponent {
  form;
  loading = false;
  errorMsg = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly translate: TranslateService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern(/^[\w-]+$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*\d).{8,}$/)]],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';
    const { email, username, password } = this.form.value;
    this.auth.register(email!, username!, password!).subscribe({
      next: () => { void this.router.navigate(['/lobby']); },
      error: (err) => {
        this.loading = false;
        this.errorMsg = err?.error?.message ?? this.translate.instant('auth.register_error');
      },
    });
  }
}
