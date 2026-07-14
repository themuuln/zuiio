/// Shadcn UI components — installed via CLI into `lib/ui/shadcn/components/`.
///
/// This barrel re-exports components that don't share internal symbol names.
/// Components with cross-package name conflicts (autocomplete + text_field,
/// scrollable + scrollable_client, tab_container + tabs, menu + menubar + popup)
/// should be imported individually:
///
/// ```dart
/// import 'package:tamga/ui/shadcn/components/form/autocomplete/autocomplete.dart';
/// import 'package:tamga/ui/shadcn/components/form/text_field/text_field.dart';
/// ```
library shadcn;

// ── Control ──
export 'components/control/button/button.dart';
export 'components/control/clickable/clickable.dart';
export 'components/control/command/command.dart';
export 'components/control/hover/hover.dart';
export 'components/control/patch/patch.dart';
export 'components/control/scrollbar/scrollbar.dart';
export 'components/control/scrollview/scrollview.dart';

// ── Display ──
export 'components/display/avatar/avatar.dart';
export 'components/display/badge/badge.dart';
export 'components/display/border_loading/border_loading.dart';
export 'components/display/calendar/calendar.dart';
export 'components/display/carousel/carousel.dart';
export 'components/display/chat/chat.dart';
export 'components/display/chip/chip.dart';
export 'components/display/circular_progress_indicator/circular_progress_indicator.dart';
export 'components/display/code_snippet/code_snippet.dart';
export 'components/display/divider/divider.dart';
export 'components/display/dot_indicator/dot_indicator.dart';
export 'components/display/empty_state/empty_state.dart';
export 'components/display/feature_carousel/feature_carousel.dart';
export 'components/display/icon/icon.dart';
export 'components/display/keyboard_shortcut/keyboard_shortcut.dart';
export 'components/display/linear_progress_indicator/linear_progress_indicator.dart';
export 'components/display/number_ticker/number_ticker.dart';
export 'components/display/progress/progress.dart';
export 'components/display/selectable/selectable.dart';
export 'components/display/skeleton/skeleton.dart';
export 'components/display/spinner/spinner.dart';
export 'components/display/text/text.dart';
export 'components/display/text_animate/text_animate.dart';
export 'components/display/tracker/tracker.dart';
export 'components/display/tree/tree.dart';
export 'components/display/triple_dots/triple_dots.dart';

// ── Form (individually conflict-free) ──
export 'components/form/checkbox/checkbox.dart';
export 'components/form/color_input/color_input.dart';
export 'components/form/date_picker/date_picker.dart';
export 'components/form/dropzone/dropzone.dart';
export 'components/form/file_input/file_input.dart';
export 'components/form/file_picker/file_picker.dart';
export 'components/form/formatter/formatter.dart';
export 'components/form/history/history.dart';
export 'components/form/input_otp/input_otp.dart';
export 'components/form/item_picker/item_picker.dart';
export 'components/form/multiple_choice/multiple_choice.dart';
export 'components/form/object_input/object_input.dart';
export 'components/form/phone_input/phone_input.dart';
export 'components/form/radio_group/radio_group.dart';
export 'components/form/select/select.dart';
export 'components/form/slider/slider.dart';
export 'components/form/star_rating/star_rating.dart';
export 'components/form/switch/switch.dart';
export 'components/form/text_area/text_area.dart';
export 'components/form/time_picker/time_picker.dart';
export 'components/form/validated/validated.dart';
// Import individually when needed:
//   autocomplete, text_field, form, control, color_picker, chip_input, formatted_input
//   (cross-package name conflicts with sibling components)

// ── Layout ──
export 'components/layout/accordion/accordion.dart';
export 'components/layout/alert/alert.dart';
export 'components/layout/app/app.dart';
export 'components/layout/basic/basic.dart';
export 'components/layout/card/card.dart';
export 'components/layout/card_image/card_image.dart';
export 'components/layout/collapsible/collapsible.dart';
export 'components/layout/fade_scroll/fade_scroll.dart';
export 'components/layout/filter_bar/filter_bar.dart';
export 'components/layout/flex/flex.dart';
export 'components/layout/hidden/hidden.dart';
export 'components/layout/media_query/media_query.dart';
export 'components/layout/outlined_container/outlined_container.dart';
export 'components/layout/overflow_marquee/overflow_marquee.dart';
export 'components/layout/resizable/resizable.dart';
export 'components/layout/scaffold/scaffold.dart';
export 'components/layout/sortable/sortable.dart';
export 'components/layout/stage_container/stage_container.dart';
export 'components/layout/steps/steps.dart';
export 'components/layout/timeline/timeline.dart';
export 'components/layout/window/window.dart';
// Import individually: scrollable, scrollable_client, table
//   (cross-package name conflicts)

// ── Navigation ──
export 'components/navigation/breadcrumb/breadcrumb.dart';
export 'components/navigation/navigation_bar/navigation_bar.dart';
export 'components/navigation/navigation_menu/navigation_menu.dart';
export 'components/navigation/pagination/pagination.dart';
export 'components/navigation/stepper/stepper.dart';
export 'components/navigation/subfocus/subfocus.dart';
export 'components/navigation/switcher/switcher.dart';
// Import individually: tab_container, tab_pane, tabs
//   (cross-package name conflicts)

// ── Overlay ──
export 'components/overlay/alert_dialog/alert_dialog.dart';
export 'components/overlay/dialog/dialog.dart';
export 'components/overlay/drawer/drawer.dart';
export 'components/overlay/dropdown_menu/dropdown_menu.dart';
export 'components/overlay/eye_dropper/eye_dropper.dart';
export 'components/overlay/gooey_toast/gooey_toast.dart';
export 'components/overlay/hover_card/hover_card.dart';
export 'components/overlay/overlay/overlay.dart';
export 'components/overlay/popover/popover.dart';
export 'components/overlay/refresh_trigger/refresh_trigger.dart';
export 'components/overlay/swiper/swiper.dart';
export 'components/overlay/toast/toast.dart';
export 'components/overlay/tooltip/tooltip.dart';
// Import individually: context_menu, menu, menubar, popup
//   (cross-package name conflicts)

// ── Utility ──
export 'components/utility/alpha/alpha.dart';
export 'components/utility/async/async.dart';
export 'components/utility/color/color.dart';
export 'components/utility/debug/debug.dart';
export 'components/utility/error_system/error_system.dart';
export 'components/utility/focus_outline/focus_outline.dart';
export 'components/utility/image/image.dart';
export 'components/utility/locale_utils/locale_utils.dart';
export 'components/utility/repeated_animation_builder/repeated_animation_builder.dart';
export 'components/utility/shadcn_localizations/shadcn_localizations.dart';
export 'components/utility/shadcn_localizations_en/shadcn_localizations_en.dart';
export 'components/utility/shadcn_localizations_extensions/shadcn_localizations_extensions.dart';
export 'components/utility/timeline_animation/timeline_animation.dart';
export 'components/utility/wrapper/wrapper.dart';
