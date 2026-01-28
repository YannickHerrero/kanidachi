import {cva, type VariantProps} from "class-variance-authority";
import {Link} from "expo-router";
import type {LinkProps} from "expo-router/build/link/Link";
import type {ExpoRouter} from "expo-router/types/expo-router";
import type React from "react";
import type {ElementType} from "react";
import {Pressable, type PressableProps, Text, View, type ViewProps} from "react-native";

import {Muted} from "./typography";

import {ChevronRight} from "@/components/Icons";
import {cn} from "@/lib/utils";
import {useThemeColors} from "@/hooks/useThemeColors";
import type {ThemeColors} from "@/lib/colors";

const listItemTextVariants = cva(
	"text-base font-normal", // base styles
	{
		variants: {
			variant: {
				default: "",
				primary: "",
				link: "text-blue-500",
				destructive: "",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

const getListItemTextColor = (variant: string | undefined | null, colors: ThemeColors): string => {
	switch (variant) {
		case "default":
			return colors.foreground;
		case "primary":
			return colors.primary;
		case "destructive":
			return colors.destructive;
		case "link":
			return "#3b82f6"; // blue-500
		default:
			return colors.foreground;
	}
};

interface ItemProps {
	className: string;
	color: string;
	size: number;
}

// Define props for ListItem with TypeScript interface
type ListItemProps = VariantProps<typeof listItemTextVariants> & {
	label: string;
	description?: string;
	itemLeft?: (itemProps: ItemProps) => JSX.Element;
	itemRight?: (itemProps: ItemProps) => JSX.Element;
	onPress?: () => void;
	/**
	 * If true, a detail arrow will appear on the item.
	 */
	detail?: boolean;
	/**
	 * Convert the default Pressable with a Link component.
	 */
	href?: ExpoRouter.Href;
	className?: string;
} & (ViewProps | PressableProps | LinkProps);

// ListItem component
const ListItem: React.FC<ListItemProps> = ({
	label,
	description,
	itemLeft,
	itemRight,
	detail = true,
	variant,
	className,
	href,
	style,
	...props
}) => {
	const colors = useThemeColors();
	const textColor = getListItemTextColor(variant, colors);

	// Automatically add ChevronRight if onPress is defined and detail is true
	const ItemRight = () => {
		if (itemRight) {
			return itemRight({
				className: cn("size-5 opacity-70", listItemTextVariants({variant})),
				color: textColor,
				size: 20,
			});
		} else if ((props?.onPress && detail) || (href && detail)) {
			return (
				<ChevronRight
					className={cn("size-5 opacity-70", listItemTextVariants({variant}))}
					color={textColor}
				/>
			);
		}
		return null;
	};
	const pressable = props?.onPress || href;
	const Component = (pressable ? Pressable : View) as ElementType<
		ViewProps | PressableProps | LinkProps
	>;

	const body = (
		<Component
			className={cn(
				"flex-row items-center justify-between w-full px-4 py-3 border-b",
				pressable ? "web:hover:opacity-90 active:opacity-90" : "",
				listItemTextVariants({variant}),
				className,
			)}
			style={[{borderColor: colors.border, backgroundColor: colors.card}, style]}
			accessibilityRole={pressable ? "button" : "none"}
			accessibilityLabel={`${ label }${ description ? `, ${ description }` : "" }`}
			{...props}
		>
			{itemLeft && (
				<View className="mr-3">
					{itemLeft({
						className: cn(
							listItemTextVariants({variant}),
						),
						color: textColor,
						size: 22,
					})}
				</View>
			)}
			<View className="flex-1">
				<Text style={{color: textColor}} className={cn(listItemTextVariants({variant}))}>{label}</Text>
				{description && <Muted>{description}</Muted>}
			</View>
			<ItemRight />
		</Component>
	);
	if (href) {
		return (
			<Link href={href} asChild>
				{body}
			</Link>
		);
	} else {
		return body;
	}
};

export default ListItem;
